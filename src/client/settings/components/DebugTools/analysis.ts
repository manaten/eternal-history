/**
 * DebugTools 専用の語彙解析ユーティリティ。
 *
 * 本実装は `domain/word-index/` を参照。こちらは production 実装から見えない
 * 「フィルタ前の生セグメンテーション結果」「閾値別の分布」など中間状態を
 * 観測するためだけのユーティリティ。production コードから import しないこと。
 */

const JA_SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

export interface RawAnalysis {
  /** ノイズフィルタ前の単語 → 出現回数 */
  wordCounts: Map<string, number>;
  totalChars: number;
  totalTokens: number;
}

/**
 * ノイズフィルタを通さない、素のセグメンテーション結果を返す。
 * フィルタの効き具合 (削減量) を測るための比較対照用。
 */
export function analyzeRawTokens(texts: readonly string[]): RawAnalysis {
  const wordCounts = new Map<string, number>();
  const totalChars = texts.reduce((acc, t) => acc + t.length, 0);

  const tokens = texts.flatMap((text) =>
    [...JA_SEGMENTER.segment(text)]
      .filter((s) => s.isWordLike)
      .map((s) => s.segment),
  );

  for (const word of tokens) {
    // eslint-disable-next-line functional/immutable-data
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }

  return { wordCounts, totalChars, totalTokens: tokens.length };
}

export interface CountBucket {
  threshold: number;
  uniqueWords: number;
}

export function bucketByCount(
  wordCounts: Map<string, number>,
  thresholds: readonly number[],
): CountBucket[] {
  const counts = [...wordCounts.values()];
  return thresholds.map((threshold) => ({
    threshold,
    uniqueWords: counts.filter((c) => c >= threshold).length,
  }));
}

export interface LengthBucket {
  length: string;
  uniqueWords: number;
  ratio: number;
}

export function bucketByLength(
  wordCounts: Map<string, number>,
): LengthBucket[] {
  const total = wordCounts.size;
  const buckets = new Map<string, number>([
    ["1", 0],
    ["2", 0],
    ["3", 0],
    ["4+", 0],
  ]);
  for (const word of wordCounts.keys()) {
    const key = word.length >= 4 ? "4+" : String(word.length);
    // eslint-disable-next-line functional/immutable-data
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([length, uniqueWords]) => ({
    length,
    uniqueWords,
    ratio: total === 0 ? 0 : uniqueWords / total,
  }));
}

export function topWords(
  wordCounts: Map<string, number>,
  n: number,
): readonly [string, number][] {
  return [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** JSON 文字列長 × 2 (UTF-16) で Map のおおよそのバイト数を概算。 */
export function approximateMapSizeBytes(
  map: Map<string, number | readonly string[]>,
): number {
  return JSON.stringify([...map]).length * 2;
}
