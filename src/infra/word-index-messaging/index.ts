import { WordIndexService } from "../../domain/word-index/service";
import {
  RebuildIndexResponse,
  RuntimeRequest,
  SuggestResponse,
} from "../../types/messages";

const DEFAULT_SUGGEST_LIMIT = 10;

/**
 * `chrome.runtime.onMessage` のリスナーを組み立てる。
 * background.ts で
 * `chrome.runtime.onMessage.addListener(makeWordIndexMessageListener(service))`
 * のように明示的に登録する。
 *
 * ドメインサービス (`createWordIndexService`) と chrome.runtime のバインディングを
 * 分けることで、テストや別 consumer から service だけを差し替えて再利用できる。
 */
export function makeWordIndexMessageListener(
  service: WordIndexService,
): (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean {
  return (message, _sender, sendResponse) => {
    const msg = message as RuntimeRequest | null | undefined;
    if (msg?.type === "suggest") {
      void (async () => {
        try {
          const suggestions = await service.suggest(
            msg.query,
            msg.limit ?? DEFAULT_SUGGEST_LIMIT,
          );
          sendResponse({ suggestions } satisfies SuggestResponse);
        } catch (e) {
          console.error("suggest failed:", e);
          // service-level エラーは error フィールドで透過し、client に throw させる。
          // UI 側で「state を更新しない」復旧パスに乗せるため、空配列を成功扱いで
          // 返してはいけない。
          sendResponse({
            suggestions: [],
            error: String(e),
          } satisfies SuggestResponse);
        }
      })();
      return true;
    }
    if (msg?.type === "rebuild-index") {
      void (async () => {
        try {
          const t0 = performance.now();
          const built = await service.rebuild();
          sendResponse({
            ok: true,
            wordCount: built.wordCounts.size,
            elapsedMs: performance.now() - t0,
          } satisfies RebuildIndexResponse);
        } catch (e) {
          console.error("Failed to rebuild WordIndex:", e);
          sendResponse({
            ok: false,
            error: String(e),
          } satisfies RebuildIndexResponse);
        }
      })();
      return true;
    }
    return false;
  };
}
