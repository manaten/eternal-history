import {
  RebuildIndexRequest,
  RebuildIndexResponse,
  SuggestRequest,
  SuggestResponse,
} from "../types/messages";

/**
 * background の WordIndex に対してサジェスト候補を問い合わせる。
 *
 * 失敗 (background 未起動・通信切断など) は throw する。呼び出し側は
 * catch して「state を更新しない」ことで、一時障害が空配列として焼き付くのを防ぐ。
 * 正常系で候補ゼロのときは `[]` を resolve する (これは焼き付いても問題ない)。
 */
export async function requestSuggestions(
  query: string,
  limit = 10,
): Promise<readonly string[]> {
  const request: SuggestRequest = { type: "suggest", query, limit };
  const response = (await chrome.runtime.sendMessage(request)) as
    | SuggestResponse
    | undefined;
  if (!response) {
    throw new Error("No response from background for suggest request");
  }
  return response.suggestions;
}

/**
 * WordIndex を background でフル再構築する。設定ページの DebugTools から呼ばれる。
 */
export async function requestRebuildIndex(): Promise<RebuildIndexResponse> {
  const request: RebuildIndexRequest = { type: "rebuild-index" };
  return (await chrome.runtime.sendMessage(request)) as RebuildIndexResponse;
}
