/**
 * background ↔ UI 間のメッセージプロトコル。
 * 全てのメッセージは `type` フィールドで判別する。
 */

export interface SuggestRequest {
  type: "suggest";
  query: string;
  limit?: number;
}

export interface SuggestResponse {
  suggestions: readonly string[];
  /**
   * background 側で service-level エラーが起きたときの説明。
   * client は present なら throw して呼び出し側に異常を伝える。
   * 「候補ゼロ」は error なしの空配列で表現する。
   */
  error?: string;
}

export interface RebuildIndexRequest {
  type: "rebuild-index";
}

export interface RebuildIndexResponse {
  ok: boolean;
  wordCount?: number;
  elapsedMs?: number;
  error?: string;
}

export type RuntimeRequest = SuggestRequest | RebuildIndexRequest;
