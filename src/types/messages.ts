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
