import {
  buildWordIndex,
  lookupSuggestions,
  WordIndex,
} from "../../domain/word-index";
import {
  RebuildIndexResponse,
  RuntimeRequest,
  SuggestResponse,
} from "../../types/messages";

/**
 * background SW における WordIndex のライフサイクル管理。
 *
 * 設計方針: **差分更新を持たず、都度フル再構築する**。
 *
 * - 構築は always-fresh: ブックマーク全件から都度 build する。差分更新 (addText) は
 *   持たない。これにより onVisited × rebuild の race やタイトル更新の二重カウントが
 *   構造的に発生しなくなる (一度の build がスナップショットを取って終わるだけ)。
 *
 * - 連続発火の coalescing: ビルド実行中に新たな {@link scheduleRebuild} 要求が来た
 *   場合は `pending` フラグを立てるだけで何もしない。実行中のビルドが終わったあと
 *   pending が立っていたらもう一度ビルドする。これで「同時に何度頼まれても、最大で
 *   currentBuild + nextBuild の 2 連発」に抑える。
 *
 * - onVisited からのトリガーは debounce する: ブラウジング中の頻発する onVisited で
 *   毎回ビルドが走らないよう、debounce window 内に最後のトリガーから N 秒経って
 *   から実体のビルドを開始する。
 *
 * - getIndex (suggest 経路): キャッシュされた `latestIndex` があれば即返す。
 *   無ければビルドを起動して待つ。ビルド失敗時はキャッシュをクリアして次回再試行。
 */

const DEFAULT_SUGGEST_LIMIT = 10;

/**
 * onVisited からの scheduleRebuild を集約する debounce 窓。
 * 訪問してから「サジェスト候補に出てくる」までの最大遅延 ≒ DEBOUNCE_MS + ビルド時間。
 */
const REBUILD_DEBOUNCE_MS = 5000;

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
}

export interface WordIndexService {
  /**
   * 再構築を依頼する。debounce + 単スロット queue で実体ビルドを抑制する。
   * 連続呼出しても最大で「実行中の 1 件 + 次に予約された 1 件」に集約される。
   */
  scheduleRebuild: () => void;
}

export function initWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let latestIndex: WordIndex | null = null;
  // eslint-disable-next-line functional/no-let
  let inFlightBuild: Promise<WordIndex> | null = null;
  // eslint-disable-next-line functional/no-let
  let pending = false;
  // eslint-disable-next-line functional/no-let
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function runBuildLoop(): Promise<WordIndex> {
    // pending が立っている限り、ビルドを連続実行する (最大 1 段)。
    // pending を loop の先頭でクリアするので、ビルド中に来たトリガーは次のラウンドで拾われる。
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

  function triggerRebuild(): Promise<WordIndex> {
    // debounce が走っていたら即時実行に切り替えるためタイマーを解除
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (inFlightBuild) {
      pending = true;
      return inFlightBuild;
    }
    inFlightBuild = runBuildLoop().catch((e) => {
      // 失敗時はキャッシュをクリア。次回 getIndex / triggerRebuild で再試行できる。
      inFlightBuild = null;
      latestIndex = null;
      throw e;
    });
    return inFlightBuild;
  }

  function scheduleRebuild(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      triggerRebuild().catch((e) =>
        console.error("Scheduled rebuild failed:", e),
      );
    }, REBUILD_DEBOUNCE_MS);
  }

  function getIndex(): Promise<WordIndex> {
    if (latestIndex) return Promise.resolve(latestIndex);
    return triggerRebuild();
  }

  async function rebuildForRequest(): Promise<RebuildIndexResponse> {
    try {
      const t0 = performance.now();
      const built = await triggerRebuild();
      return {
        ok: true,
        wordCount: built.wordCounts.size,
        elapsedMs: performance.now() - t0,
      };
    } catch (e) {
      console.error("Failed to rebuild WordIndex:", e);
      return { ok: false, error: String(e) };
    }
  }

  chrome.runtime.onMessage.addListener(
    (message: RuntimeRequest, _sender, sendResponse) => {
      if (message?.type === "suggest") {
        void (async () => {
          try {
            const index = await getIndex();
            const suggestions = lookupSuggestions(
              index,
              message.query,
              message.limit ?? DEFAULT_SUGGEST_LIMIT,
            );
            sendResponse({ suggestions } satisfies SuggestResponse);
          } catch (e) {
            console.error("suggest failed:", e);
            // service-level エラーは error フィールドに詰めて client に throw させる。
            // UI 側で「state を更新しない」復旧パスに乗せるため、空配列を成功として
            // 返してはいけない。
            sendResponse({
              suggestions: [],
              error: String(e),
            } satisfies SuggestResponse);
          }
        })();
        return true;
      }
      if (message?.type === "rebuild-index") {
        void rebuildForRequest().then(sendResponse);
        return true;
      }
      return false;
    },
  );

  return { scheduleRebuild };
}
