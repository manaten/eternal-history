/**
 * インクリメンタルサジェスト用の語彙インデックス。
 *
 * - `wordCounts`: 単語 → 累積出現回数 (ランキング用)
 * - `prefixIndex`: 単語先頭 1 文字 (小文字化キー) → その文字で始まる単語のリスト
 *   (ルックアップ高速化用、wordCounts の派生データ)
 *
 * 2 つの Map は常に整合している必要がある。差分更新 API は持たず、毎回
 * {@link buildWordIndex} でゼロから再構築する設計。
 *
 * このインデックスは MV3 service worker のメモリ上にのみ存在し、永続化しない。
 * SW kill 後の次の wake では `bookmarkHistoryStore.getAll()` から再構築する。
 */
export interface WordIndex {
  wordCounts: Map<string, number>;
  prefixIndex: Map<string, string[]>;
}
