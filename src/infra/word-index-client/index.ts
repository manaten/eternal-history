import {
  RebuildIndexRequest,
  RebuildIndexResponse,
  SuggestRequest,
  SuggestResponse,
} from "../../types/messages";

/**
 * UI (NewTab / Options) 側から background SW の WordIndex サービスに
 * 問い合わせるクライアント。`chrome.runtime.sendMessage` の薄いラッパ。
 */

/**
 * サジェスト候補を問い合わせる。
 *
 * 失敗 (background 未起動・通信切断など) は throw する。呼び出し側は
 * catch して「state を更新しない」ことで、一時障害が空配列として焼き付くのを防ぐ。
 * 正常系で候補ゼロのときは `[]` を resolve する。
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
 * WordIndex のキャッシュを無効化し、ブックマークから再構築させる。
 * DebugTools の「Rebuild word index」ボタンから呼ばれる。
 */
export async function requestRebuildIndex(): Promise<RebuildIndexResponse> {
  const request: RebuildIndexRequest = { type: "rebuild-index" };
  const response = (await chrome.runtime.sendMessage(request)) as
    | RebuildIndexResponse
    | undefined;
  if (!response) {
    return { ok: false, error: "No response from background" };
  }
  return response;
}
