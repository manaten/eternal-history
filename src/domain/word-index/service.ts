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
 * - {@link getIndex}: メモリ上の `latestIndex` があれば即返す。無ければ永続
 *   キャッシュ (deps.cache) をロードして返し、それも無ければビルドを起動して待つ。
 *   ビルド失敗時は inFlightBuild だけクリアして次回再試行。
 *
 * - 永続キャッシュはビルド成功のたびに丸ごと置き換え保存する。ビルドは都度フル
 *   再構築 (上述) なので、キャッシュ側も差分管理が要らず常に全置換で整合する。
 *   SW kill → wake 後の初回サジェストはキャッシュロードだけで返せるため、
 *   ブックマーク全件走査 + 再ビルドの待ち時間が消える。
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
  /**
   * 永続キャッシュ (任意)。load は「キャッシュ無し / 読めない」を null で返す。
   * save はビルド成功ごとに丸ごと置き換えで呼ばれる。
   */
  cache?: {
    load: () => Promise<WordIndex | null>;
    save: (index: WordIndex) => Promise<void>;
  };
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
  // eslint-disable-next-line functional/no-let
  let inFlightCacheLoad: Promise<WordIndex | null> | null = null;

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
      // 永続キャッシュを丸ごと置き換える。保存失敗は次回ビルドで上書きされる
      // だけなので、ビルド完了 (= suggest 可能になる) を保存に待たせない。
      deps.cache
        ?.save(built)
        .catch((e) => console.warn("Failed to persist WordIndex cache:", e));
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
      // 失敗時は inFlightBuild だけクリアして次回再試行可能にする。
      // latestIndex は前回成功したものを温存し、suggest が空待ちにならないよう
      // graceful degradation する (transient 失敗で良いキャッシュを失わない)。
      inFlightBuild = null;
      throw e;
    });
    return inFlightBuild;
  }

  function scheduleRebuild(): void {
    // ビルド中ならその loop に pending として集約する。throttle タイマーを
    // 新規セットすると、build 進行中に来た visit が現 build に間に合わず、
    // かつ次の build を最大 2 * REBUILD_THROTTLE_MS 先まで待つことになる。
    if (inFlightBuild) {
      pending = true;
      return;
    }
    // 既にタイマーが走っている場合は何もしない (throttle)。
    // ここで clearTimeout してリセットすると、頻繁な onVisited で永久にタイマーが
    // 進まず一生 rebuild されない状態になってしまう。
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      rebuild().catch((e) => console.error("Scheduled rebuild failed:", e));
    }, REBUILD_THROTTLE_MS);
  }

  async function getIndex(): Promise<WordIndex> {
    if (latestIndex) return latestIndex;
    if (inFlightBuild) return inFlightBuild;
    if (deps.cache) {
      // 並行する getIndex で load が多重発行されないよう in-flight を共有する。
      // load 失敗は「キャッシュ無し」と同じ扱いでフル再構築に落とす。
      inFlightCacheLoad ??= deps.cache.load().catch((e) => {
        console.warn("Failed to load WordIndex cache:", e);
        return null;
      });
      const cached = await inFlightCacheLoad;
      inFlightCacheLoad = null;
      // load 待ちの間に rebuild() (DebugTools 等) が走った場合はキャッシュより
      // 新しいので、そちらを優先する。
      if (latestIndex) return latestIndex;
      if (inFlightBuild) return inFlightBuild;
      if (cached) {
        latestIndex = cached;
        return cached;
      }
    }
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
