import {
  addText,
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
 * - SW のメモリにのみ index を保持する (永続化しない)。SW kill で消えるが、
 *   次の wake で初回 suggest 要求が来たタイミングで遅延構築する。
 * - 構築中に複数の suggest が来ても 1 つの promise を共有して再構築は起きない。
 * - 構築が reject した場合はキャッシュをクリアし、次回呼び出しで再試行する
 *   (永久に壊れた状態が続くのを防ぐ)。
 * - SW ライフタイム中の新規訪問は {@link addVisit} で in-memory にだけ反映する。
 *   SW kill 後はブックマーク本体を sourceOfTruth として再構築されるので整合する。
 */

const DEFAULT_SUGGEST_LIMIT = 10;

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
}

export interface WordIndexService {
  /** SW ライフタイム中の新規訪問タイトルを in-memory index に反映する。 */
  addVisit: (text: string) => void;
  /** 明示的なキャッシュ無効化。次回 suggest で再構築が走る。 */
  invalidate: () => void;
}

export function initWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let indexPromise: Promise<WordIndex> | null = null;

  function build(): Promise<WordIndex> {
    const t0 = performance.now();
    return deps.getSourceTexts().then((texts) => {
      const built = buildWordIndex(texts);
      console.log(
        `WordIndex built: ${built.wordCounts.size} words from ${texts.length} texts in ${(performance.now() - t0).toFixed(0)}ms`,
      );
      return built;
    });
  }

  function getIndex(): Promise<WordIndex> {
    if (!indexPromise) {
      // 失敗時はキャッシュをクリアして次回再試行できるようにする
      indexPromise = build().catch((e) => {
        indexPromise = null;
        throw e;
      });
    }
    return indexPromise;
  }

  function addVisit(text: string): void {
    // 構築済み (or 進行中) の場合のみ反映。未構築なら次回 getIndex で
    // ソースからまとめて拾われるので何もしない。
    if (!indexPromise) return;
    indexPromise
      .then((index) => addText(index, text))
      .catch(() => {
        /* getIndex の catch でハンドル済み */
      });
  }

  function invalidate(): void {
    indexPromise = null;
  }

  async function rebuildForRequest(): Promise<RebuildIndexResponse> {
    try {
      const t0 = performance.now();
      invalidate();
      const built = await getIndex();
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
            sendResponse({ suggestions: [] } satisfies SuggestResponse);
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

  return { addVisit, invalidate };
}
