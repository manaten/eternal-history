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
 * MV3 service worker のメモリ上に保持しつつ、ビルド成功ごとに
 * chrome.storage.local へ丸ごと置き換えで永続化する (`infra/word-index-cache`)。
 * SW kill 後の次の wake ではまずキャッシュをロードし、キャッシュが無い・読めない
 * 場合のみ `bookmarkHistoryStore.getAll()` からフル再構築する。
 */
export interface WordIndex {
  wordCounts: Map<string, number>;
  prefixIndex: Map<string, string[]>;
}
