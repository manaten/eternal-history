/**
 * Intl.Segmenter を用いた語彙分析ユーティリティ。
 * インクリメンタルサジェストの実現可能性を測るためのデバッグ用途。
 *
 * 本実装は `domain/word-index/` を参照。こちらは「フィルタなしの素のセグメンテーション結果」や
 * 「閾値別の分布」など、本実装からは見えない中間状態を観測するためのユーティリティ。
 */

import { isNoiseWord } from "../domain/word-index/noise";

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
 * 単語の先頭 2 文字 → 単語リストの索引を作る。
 * "tok" のような入力時、`index.get("to")` を取って startsWith フィルタするだけで
 * 候補を絞り込める。1 文字目だけだと候補が爆発するので 2 文字をキーにする。
 */
export function buildPrefixIndex(
  wordCounts: Map<string, number>,
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const word of wordCounts.keys()) {
    if (word.length < 2) continue;
    const prefix = word.slice(0, 2);
    const list = index.get(prefix);
    if (list) {
      // eslint-disable-next-line functional/immutable-data
      list.push(word);
    } else {
      // eslint-disable-next-line functional/immutable-data
      index.set(prefix, [word]);
    }
  }
  return index;
}

/**
 * 先頭 2 文字索引のサイズを JSON 換算で概算する。
 */
export function approximatePrefixIndexSizeBytes(
  index: Map<string, string[]>,
): number {
  return JSON.stringify([...index]).length * 2;
}

/**
 * prefix index を引いてサジェスト候補を返す。クエリは 2 文字以上を前提。
 * 結果は出現回数の降順で `limit` 件まで。
 */
export function lookupSuggestions(
  index: Map<string, string[]>,
  wordCounts: Map<string, number>,
  query: string,
  limit: number,
): readonly [string, number][] {
  if (query.length < 2) return [];
  const candidates = index.get(query.slice(0, 2)) ?? [];
  const matched =
    query.length === 2
      ? candidates
      : candidates.filter((w) => w.startsWith(query));
  return matched
    .map((w) => [w, wordCounts.get(w) ?? 0] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
