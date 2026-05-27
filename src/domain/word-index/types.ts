/**
 * インクリメンタルサジェスト用の語彙インデックス。
 *
 * - `wordCounts`: 単語 → 累積出現回数 (ランキング用)
 * - `prefixIndex`: 単語先頭 2 文字 → その 2 文字で始まる単語のリスト
 *   (ルックアップ高速化用、wordCounts の派生データ)
 *
 * 2 つの Map は常に整合している必要がある。直接編集せず {@link addText} 経由で更新する。
 */
export interface WordIndex {
  schemaVersion: number;
  wordCounts: Map<string, number>;
  prefixIndex: Map<string, string[]>;
}

/**
 * ノイズ判定ロジックやセグメンタ仕様に互換性のない変更を加えたらインクリメントする。
 * `loadWordIndex` がバージョン不一致を検出したら null を返し、フル再構築が走る。
 */
export const WORD_INDEX_SCHEMA_VERSION = 1;
