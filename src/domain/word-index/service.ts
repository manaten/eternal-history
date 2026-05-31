import { buildWordIndex, lookupSuggestions } from "./index";
import { WordIndex } from "./types";

/**
 * WordIndex のライフサイクルを管理するドメインサービス。
 *
 * 設計方針: **差分更新を持たず、都度フル再構築する**。
 *
 * - 構築は always-fresh: 入力テキスト全件から都度 build する。差分更新 API は持たない。
 *   これにより onVisited × rebuild の race やタイトル更新の二重カウントが構造的に
 *   発生しない (一度の build がスナップショットを取って終わるだけ)。
 *
 * - 連続発火の coalescing: ビルド実行中に新たな {@link scheduleRebuild} 要求が来た
 *   場合は `pending` フラグを立てるだけで何もしない。実行中ビルドが終わったあと
 *   pending が立っていたらもう一度ビルドする。最大で「currentBuild + nextBuild」の
 *   2 連発に集約される。
 *
 * - {@link scheduleRebuild} は throttle する: ブラウジング中の頻発する onVisited で
 *   毎回ビルドが走らないよう、最初のリクエストでタイマーをセットして
 *   REBUILD_THROTTLE_MS 後に発火する。タイマー中の追加リクエストは無視。
 *   毎回タイマーをリセットする debounce 方式だと、頻繁な onVisited で永久に
 *   発火しなくなるので throttle にしている。ブラウザ拡張は常駐するため、CPU を
 *   無闇に消費しない設定にする。
 *
 * - {@link getIndex}: キャッシュされた `latestIndex` があれば即返す。
 *   無ければビルドを起動して待つ。ビルド失敗時はキャッシュをクリアして次回再試行。
 *
 * 入出力は `getSourceTexts` 経由で抽象化されており、本サービス自体は chrome API に
 * 依存しない (domain 層に置ける)。chrome.runtime.onMessage への bind は
 * `infra/word-index-messaging` が担う。
 */

/**
 * onVisited 等からの scheduleRebuild が「次のビルドまでに最低限あける時間」。
 * throttle として働く: 最初の scheduleRebuild でタイマーがセットされたあとは、
 * REBUILD_THROTTLE_MS 経過してタイマーが発火するまでの間に来た追加リクエストは
 * 無視される。これにより頻繁な onVisited でタイマーが永久にリセットされ続けて
 * 一生 rebuild されない、という事態を防ぐ。
 *
 * 訪問から「サジェスト候補に出てくる」までの最大遅延 ≒ REBUILD_THROTTLE_MS + ビルド時間。
 * 拡張機能はバックグラウンドで常駐するため、CPU をいたずらに消費しないよう長めに取る。
 */
const REBUILD_THROTTLE_MS = 30 * 60 * 1000; // 30 分

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
}

export interface WordIndexService {
  /** キャッシュ済 index を返す。無ければビルドして待つ。 */
  getIndex: () => Promise<WordIndex>;
  /**
   * クエリに対するサジェスト候補を返す。getIndex してから lookup するだけのヘルパ。
   */
  suggest: (query: string, limit: number) => Promise<readonly string[]>;
  /**
   * 即時再構築。throttle タイマーを skip する。
   * 既にビルド実行中なら pending を立て、完了後に追加ビルドが走ったあとの最終 index を待つ。
   */
  rebuild: () => Promise<WordIndex>;
  /**
   * 再構築を throttle してから依頼する。最初の呼出でタイマーをセット、以後タイマーが
   * 発火するまでの呼出は no-op。実行中の追加リクエストは pending で最大 1 件集約。
   */
  scheduleRebuild: () => void;
}

export function createWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let latestIndex: WordIndex | null = null;
  // eslint-disable-next-line functional/no-let
  let inFlightBuild: Promise<WordIndex> | null = null;
  // eslint-disable-next-line functional/no-let
  let pending = false;
  // eslint-disable-next-line functional/no-let
  let throttleTimer: ReturnType<typeof setTimeout> | null = null;

  async function runBuildLoop(): Promise<WordIndex> {
    // pending が立っている間はビルドを連続実行する (1 段だけ「次」を許す)。
    // 先頭で pending をクリアするので、ビルド中に来たトリガーは次ラウンドで拾われる。
    do {
      pending = false;
      const t0 = performance.now();
      const texts = await deps.getSourceTexts();
      const built = buildWordIndex(texts);
      latestIndex = built;
      console.log(
        `WordIndex built: ${built.wordCounts.size} words from ${texts.length} texts in ${(performance.now() - t0).toFixed(0)}ms`,
      );
    } while (pending);
    inFlightBuild = null;
    return latestIndex!;
  }

  function rebuild(): Promise<WordIndex> {
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    if (inFlightBuild) {
      pending = true;
      return inFlightBuild;
    }
    inFlightBuild = runBuildLoop().catch((e) => {
      // 失敗時はキャッシュをクリアして次回再試行できるようにする
      inFlightBuild = null;
      latestIndex = null;
      throw e;
    });
    return inFlightBuild;
  }

  function scheduleRebuild(): void {
    // 既にタイマーが走っている場合は何もしない (throttle)。
    // ここで clearTimeout してリセットすると、頻繁な onVisited で永久にタイマーが
    // 進まず一生 rebuild されない状態になってしまう。
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      rebuild().catch((e) => console.error("Scheduled rebuild failed:", e));
    }, REBUILD_THROTTLE_MS);
  }

  function getIndex(): Promise<WordIndex> {
    if (latestIndex) return Promise.resolve(latestIndex);
    return rebuild();
  }

  async function suggest(
    query: string,
    limit: number,
  ): Promise<readonly string[]> {
    const index = await getIndex();
    return lookupSuggestions(index, query, limit);
  }

  return { getIndex, suggest, rebuild, scheduleRebuild };
}
