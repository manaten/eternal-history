import {
  RebuildIndexRequest,
  RebuildIndexResponse,
  SuggestRequest,
  SuggestResponse,
} from "../types/messages";

/**
 * background の WordIndex に対してサジェスト候補を問い合わせる。
 * background が落ちている / index 未構築の場合は空配列を返す (UI 側で握りつぶす)。
 */
export async function requestSuggestions(
  query: string,
  limit = 10,
): Promise<readonly string[]> {
  try {
    const request: SuggestRequest = { type: "suggest", query, limit };
    const response = (await chrome.runtime.sendMessage(request)) as
      | SuggestResponse
      | undefined;
    return response?.suggestions ?? [];
  } catch (e) {
    console.warn("suggest request failed:", e);
    return [];
  }
}

/**
 * WordIndex を background でフル再構築する。設定ページの DebugTools から呼ばれる。
 */
export async function requestRebuildIndex(): Promise<RebuildIndexResponse> {
  const request: RebuildIndexRequest = { type: "rebuild-index" };
  return (await chrome.runtime.sendMessage(request)) as RebuildIndexResponse;
}
