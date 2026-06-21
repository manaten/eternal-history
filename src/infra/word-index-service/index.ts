import {
  buildWordIndex,
  lookupSuggestions,
  WordIndex,
} from "../../domain/word-index";
import { PersistedWordIndex } from "../word-index-cache";

/**
 * WordIndex のライフサイクル (メモリ保持・永続キャッシュ・再構築) を管理する。
 *
 * - ビルドは毎回フル再構築 (差分更新なし)。入力タイトル全件のスナップショットを
 *   取るだけなので、訪問とビルドの race やタイトル更新の二重カウントが起きない。
 *
 * - 鮮度管理は builtAt (最終ビルド時刻) ベースの stale-while-revalidate。
 *   suggest / 履歴更新を契機に builtAt を見て、{@link STALE_AFTER_MS} より古ければ
 *   即座に古い index を返しつつ裏で 1 回だけ再構築する。builtAt は永続キャッシュと
 *   共に保存されるので、SW の kill/wake をまたいでも「ビルドは最大 30 分に 1 回」が
 *   成立する (MV3 では setTimeout が生き残らないためタイマー方式は使えない)。
 *
 * - ビルド中に来た再構築要求は無視してよい: 進行中ビルドが終われば builtAt は
 *   新しくなり、取りこぼした直近の訪問も次の 30 分後の再構築で拾われる。サジェスト
 *   用途では数十分の遅延は許容範囲なので、キューイングはしない。
 *
 * - 永続キャッシュはビルド成功ごとに丸ごと置き換え保存する。SW wake 後の初回
 *   サジェストはキャッシュロードだけで返せる (ブックマーク全件走査を待たない)。
 */

/** index がこれより古ければ (builtAt 基準) 再構築する。実質ビルドは最大 30 分に 1 回。 */
const STALE_AFTER_MS = 30 * 60 * 1000;

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
  /** 永続キャッシュのロード。無し / 読めない場合は null。 */
  loadCache: () => Promise<PersistedWordIndex | null>;
  /** 永続キャッシュの保存 (丸ごと置き換え)。 */
  saveCache: (index: WordIndex, builtAt: number) => Promise<void>;
}

export interface WordIndexService {
  /** クエリに対するサジェスト候補を返す。 */
  suggest: (query: string, limit: number) => Promise<readonly string[]>;
  /** 鮮度を無視して即時にフル再構築する (DebugTools 用)。 */
  rebuild: () => Promise<WordIndex>;
  /** 履歴更新の通知。index が古ければ裏で再構築する。 */
  notifyStale: () => void;
}

export function createWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let index: WordIndex | null = null;
  // eslint-disable-next-line functional/no-let
  let builtAt = 0;
  // eslint-disable-next-line functional/no-let
  let inFlightBuild: Promise<WordIndex> | null = null;

  async function build(): Promise<WordIndex> {
    const t0 = performance.now();
    const texts = await deps.getSourceTexts();
    const built = buildWordIndex(texts);
    index = built;
    builtAt = Date.now();
    console.log(
      `WordIndex built: ${built.wordCounts.size} words from ${texts.length} texts in ${(performance.now() - t0).toFixed(0)}ms`,
    );
    // 保存はビルド完了 (= suggest 可能) を待たせない。失敗しても次回ビルドで上書き。
    deps
      .saveCache(built, builtAt)
      .catch((e) => console.warn("Failed to persist WordIndex cache:", e));
    return built;
  }

  function rebuild(): Promise<WordIndex> {
    // 同時呼び出しは進行中の 1 ビルドに相乗りさせる。完了したらクリアして次回再構築可能に。

    inFlightBuild ??= build().finally(() => {
      inFlightBuild = null;
    });
    return inFlightBuild;
  }

  function revalidateIfStale(): void {
    if (Date.now() - builtAt >= STALE_AFTER_MS) {
      rebuild().catch((e) => console.error("Stale revalidation failed:", e));
    }
  }

  async function getIndex(): Promise<WordIndex> {
    if (index) {
      revalidateIfStale();
      return index;
    }
    if (inFlightBuild) return inFlightBuild;
    const cached = await deps.loadCache().catch((e) => {
      console.warn("Failed to load WordIndex cache:", e);
      return null;
    });
    // load 中に別経路でビルドが確定していたらそちらを優先 (キャッシュより新しい)。
    if (index) return index;
    if (inFlightBuild) return inFlightBuild;
    if (cached) {
      index = cached.index;
      builtAt = cached.builtAt;
      revalidateIfStale();
      return cached.index;
    }
    return rebuild();
  }

  return {
    suggest: async (query, limit) =>
      lookupSuggestions(await getIndex(), query, limit),
    rebuild,
    notifyStale: () => {
      // getIndex に委譲: index/キャッシュが古ければ再構築、無ければ初回ビルド。
      getIndex().catch((e) => console.error("notifyStale failed:", e));
    },
  };
}
