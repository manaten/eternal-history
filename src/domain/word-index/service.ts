import { buildWordIndex, lookupSuggestions, PersistedWordIndex } from "./index";
import { WordIndex } from "./types";

/**
 * WordIndex のライフサイクルを管理するドメインサービス。
 *
 * 設計方針: **差分更新を持たず、都度フル再構築 + builtAt ベースの鮮度管理**。
 *
 * - 構築は always-fresh: 入力テキスト全件から都度 build する。差分更新 API は持たない。
 *   これにより onVisited × rebuild の race やタイトル更新の二重カウントが構造的に
 *   発生しない (一度の build がスナップショットを取って終わるだけ)。
 *
 * - 再構築のスロットリングはタイマーではなく builtAt (最終ビルド時刻) で行う:
 *   suggest ({@link getIndex}) や履歴更新 ({@link rebuildIfStale}) を契機に
 *   builtAt を確認し、STALE_AFTER_MS より古ければバックグラウンドで再構築する
 *   (stale-while-revalidate)。MV3 SW は idle 約 30 秒で kill され setTimeout が
 *   生き残らないため、タイマー方式は実質機能しない。builtAt は永続キャッシュと
 *   共に保存されるので、SW の生死をまたいでも「ビルドは最大 30 分に 1 回」が成立する。
 *
 * - {@link getIndex}: メモリ → 永続キャッシュ → フル再構築の順で index を返す。
 *   メモリ / キャッシュヒット時は即返しつつ、古ければ裏で再構築を起動する。
 *   ビルド失敗時は inFlightBuild だけクリアして次回再試行。
 *
 * - 永続キャッシュはビルド成功のたびに丸ごと置き換え保存する。ビルドは都度フル
 *   再構築 (上述) なので、キャッシュ側も差分管理が要らず常に全置換で整合する。
 *   SW kill → wake 後の初回サジェストはキャッシュロードだけで返せるため、
 *   ブックマーク全件走査 + 再ビルドの待ち時間が消える。
 *
 * - race の整理:
 *   - 同時多発の鮮度チェック: inFlightBuild を確認してから rebuild を起動する。
 *     チェックと起動の間に await が無い (= 同期) ので二重ビルドにならない。
 *   - キャッシュ load 中のビルド完了/進行: load 解決後に latestIndex /
 *     inFlightBuild を再確認し、キャッシュより新しいそちらを優先する。
 *   - ビルド進行中の履歴更新: 進行中ビルドのスナップショットに含まれない
 *     可能性があるため pending に集約し、完了後にもう 1 回だけビルドする
 *     (最大「currentBuild + nextBuild」の 2 連発)。
 *
 * 入出力は `getSourceTexts` 経由で抽象化されており、本サービス自体は chrome API に
 * 依存しない (domain 層に置ける)。chrome.runtime.onMessage への bind は
 * `infra/word-index-messaging` が担う。
 */

/**
 * index をこの時間より古い (builtAt 基準) とみなして再構築する閾値。
 * suggest / 履歴更新を契機に確認するため、実質「ビルドは最大 30 分に 1 回」の
 * スロットルとして働く。訪問から「サジェスト候補に出てくる」までの最大遅延
 * ≒ この値 + 次の契機 (訪問 or suggest) + ビルド時間。
 * 拡張機能はバックグラウンドで常駐するため、CPU をいたずらに消費しないよう長めに取る。
 */
const STALE_AFTER_MS = 30 * 60 * 1000; // 30 分

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
  /**
   * 永続キャッシュ (任意)。load は「キャッシュ無し / 読めない」を null で返す。
   * save はビルド成功ごとに丸ごと置き換えで呼ばれる。builtAt は鮮度判定
   * (stale-while-revalidate) に使うビルド時刻 (epoch ms)。
   */
  cache?: {
    load: () => Promise<PersistedWordIndex | null>;
    save: (index: WordIndex, builtAt: number) => Promise<void>;
  };
}

export interface WordIndexService {
  /**
   * index を返す。メモリ → 永続キャッシュ → フル再構築の順。
   * メモリ / キャッシュヒットが STALE_AFTER_MS より古ければ、即返しつつ
   * バックグラウンドで再構築を起動する (stale-while-revalidate)。
   */
  getIndex: () => Promise<WordIndex>;
  /**
   * クエリに対するサジェスト候補を返す。getIndex してから lookup するだけのヘルパ。
   */
  suggest: (query: string, limit: number) => Promise<readonly string[]>;
  /**
   * 即時再構築。鮮度チェックを skip する。
   * 既にビルド実行中なら pending を立て、完了後に追加ビルドが走ったあとの最終 index を待つ。
   */
  rebuild: () => Promise<WordIndex>;
  /**
   * 履歴更新の通知。builtAt が STALE_AFTER_MS より古ければ再構築する
   * (新しければ何もしない = スロットル)。ビルド実行中は pending で最大 1 件集約。
   */
  rebuildIfStale: () => void;
}

export function createWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let latestIndex: WordIndex | null = null;
  // latestIndex のビルド時刻 (epoch ms)。latestIndex と必ず同時に更新する。
  // eslint-disable-next-line functional/no-let
  let latestBuiltAt = 0;
  // eslint-disable-next-line functional/no-let
  let inFlightBuild: Promise<WordIndex> | null = null;
  // eslint-disable-next-line functional/no-let
  let pending = false;
  // eslint-disable-next-line functional/no-let
  let inFlightCacheLoad: Promise<PersistedWordIndex | null> | null = null;

  async function runBuildLoop(): Promise<WordIndex> {
    // pending が立っている間はビルドを連続実行する (1 段だけ「次」を許す)。
    // 先頭で pending をクリアするので、ビルド中に来たトリガーは次ラウンドで拾われる。
    do {
      pending = false;
      const t0 = performance.now();
      const texts = await deps.getSourceTexts();
      const built = buildWordIndex(texts);
      const builtAt = Date.now();
      latestIndex = built;
      latestBuiltAt = builtAt;
      console.log(
        `WordIndex built: ${built.wordCounts.size} words from ${texts.length} texts in ${(performance.now() - t0).toFixed(0)}ms`,
      );
      // 永続キャッシュを丸ごと置き換える。保存失敗は次回ビルドで上書きされる
      // だけなので、ビルド完了 (= suggest 可能になる) を保存に待たせない。
      deps.cache
        ?.save(built, builtAt)
        .catch((e) => console.warn("Failed to persist WordIndex cache:", e));
    } while (pending);
    inFlightBuild = null;
    return latestIndex!;
  }

  function rebuild(): Promise<WordIndex> {
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

  /**
   * builtAt が古ければバックグラウンドで再構築を起動する (待たない)。
   * 進行中ビルドがあれば何もしない: ここで pending を立てると完了直後に
   * 余計なもう 1 回が走ってしまう (進行中ビルドが完了すれば鮮度は回復する)。
   * inFlightBuild のチェックと rebuild 起動の間に await が無いので原子的。
   */
  function revalidateInBackgroundIfStale(builtAt: number): void {
    if (Date.now() - builtAt < STALE_AFTER_MS) return;
    if (inFlightBuild) return;
    rebuild().catch((e) =>
      console.error("Stale index revalidation failed:", e),
    );
  }

  async function getIndex(): Promise<WordIndex> {
    if (latestIndex) {
      revalidateInBackgroundIfStale(latestBuiltAt);
      return latestIndex;
    }
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
        latestIndex = cached.index;
        latestBuiltAt = cached.builtAt;
        revalidateInBackgroundIfStale(cached.builtAt);
        return cached.index;
      }
    }
    return rebuild();
  }

  function rebuildIfStale(): void {
    // ビルド中に来た更新は、進行中ビルドのスナップショットに含まれない可能性が
    // あるため pending に集約し、完了後にもう 1 回だけビルドする。
    if (inFlightBuild) {
      pending = true;
      return;
    }
    // それ以外は getIndex に委譲する: メモリ / キャッシュの builtAt を見て
    // 古ければ裏で再構築、新しければ何もしない (= builtAt がスロットルになる)。
    // index 未構築でキャッシュも無い初回はここでフルビルドが走る。
    getIndex().catch((e) => console.error("rebuildIfStale failed:", e));
  }

  async function suggest(
    query: string,
    limit: number,
  ): Promise<readonly string[]> {
    const index = await getIndex();
    return lookupSuggestions(index, query, limit);
  }

  return { getIndex, suggest, rebuild, rebuildIfStale };
}
