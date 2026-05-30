/**
 * デバッグ用の語彙分析ユーティリティ。
 *
 * 本実装は `domain/word-index/` を参照。こちらは「フィルタなしの素のセグメンテーション結果」や
 * 「閾値別の分布」など、本実装からは見えない中間状態を観測するための補助関数群。
 *
 * 注: サジェスト本体のロジック (buildWordIndex, lookupSuggestions) は domain/word-index を使うこと。
 */

import { isNoiseWord } from "../domain/word-index/noise";
import type { WordIndex } from "../domain/word-index/types";

export interface WordAnalysisResult {
  /** 単語 → 出現回数 */
  wordCounts: Map<string, number>;
  /** 解析対象となった生テキストの合計文字数 */
  totalChars: number;
  /** isWordLike なセグメント総数 (重複含む) */
  totalTokens: number;
}

const JA_SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

/**
 * 文字列群を形態素解析し、単語の出現回数を集計する。
 * 純関数。Map は新規生成して返す。
 */
export function analyzeTexts(texts: readonly string[]): WordAnalysisResult {
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

/**
 * 出現回数ごとに「閾値以上のユニーク単語数」を集計する。
 * 例: threshold=10 → 10回以上出現する単語の種類数。
 */
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

/**
 * 単語の文字数分布。1, 2, 3, 4+ の4区分。
 */
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

/**
 * 出現回数の多い順に上位 N 件を返す。
 */
export function topWords(
  wordCounts: Map<string, number>,
  n: number,
): readonly [string, number][] {
  return [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/**
 * Map のメモリサイズ概算 (JSON 文字列長; UTF-16 換算なのでバイト数は ×2 目安)。
 */
export function approximateMapSizeBytes(
  map: Map<string, number | readonly string[]>,
): number {
  return JSON.stringify([...map]).length * 2;
}

/**
 * ノイズ単語と低頻度語をフィルタした新しい Map を返す。
 */
export function filterNoise(
  wordCounts: Map<string, number>,
  minCount: number,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const [word, count] of wordCounts) {
    if (count < minCount) continue;
    if (isNoiseWord(word)) continue;
    // eslint-disable-next-line functional/immutable-data
    result.set(word, count);
  }
  return result;
}

/**
 * WordIndex のサイズを JSON 換算で概算する。
 */
export function approximateWordIndexSizeBytes(index: WordIndex): number {
  const wordCountsSize = JSON.stringify([...index.wordCounts]).length * 2;
  const prefixIndexSize = JSON.stringify([...index.prefixIndex]).length * 2;
  return wordCountsSize + prefixIndexSize;
}
