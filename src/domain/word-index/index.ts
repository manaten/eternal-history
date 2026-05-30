import { isNoiseWord } from "./noise";
import { WordIndex } from "./types";

export { isNoiseWord } from "./noise";
export type { WordIndex } from "./types";

const JA_SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

/** prefix index のキーに使う先頭文字数。1 だと候補が爆発するので 2 を採用。 */
const PREFIX_KEY_LEN = 2;

export function createEmptyWordIndex(): WordIndex {
  return {
    wordCounts: new Map(),
    prefixIndex: new Map(),
  };
}

/**
 * テキスト群から WordIndex を構築する。2 パス構成:
 *
 *   1. exact-case ごとに出現回数を集計 (フィルタ済み)
 *   2. 同じ lower 形のバリアントを 1 グループに畳んで、各グループから
 *      **最頻ケース** を canonical として選び、合算カウントを wordCounts に格納
 *
 * 効果:
 *   - 表示形が決定的 (= 最頻ケース)。SW wake をまたいでも canonical が揺れない。
 *   - prefixIndex には canonical 1 件しか入らないので、case 順列によるバケット膨張なし。
 *   - canonical 決定が単一の post-processing パスで完結し、挿入ホットパスの
 *     O(bucket) スキャンが不要。build は O(totalTokens + uniqueCases)。
 */
export function buildWordIndex(texts: readonly string[]): WordIndex {
  // Phase 1: exact-case 出現回数
  const exactCounts = new Map<string, number>();
  for (const text of texts) {
    for (const seg of JA_SEGMENTER.segment(text)) {
      if (!seg.isWordLike) continue;
      const word = seg.segment;
      if (isNoiseWord(word)) continue;
      // eslint-disable-next-line functional/immutable-data
      exactCounts.set(word, (exactCounts.get(word) ?? 0) + 1);
    }
  }

  // Phase 2: lower キーでグルーピング、各グループの最頻ケースを canonical に。
  // 同点 (count tie) の場合は先に encounter した方を維持する。
  const groups = new Map<
    string,
    { canonical: string; canonicalCount: number; totalCount: number }
  >();
  for (const [word, count] of exactCounts) {
    const lower = word.toLowerCase();
    const existing = groups.get(lower);
    if (!existing) {
      // eslint-disable-next-line functional/immutable-data
      groups.set(lower, {
        canonical: word,
        canonicalCount: count,
        totalCount: count,
      });
    } else {
      // eslint-disable-next-line functional/immutable-data
      existing.totalCount += count;
      if (count > existing.canonicalCount) {
        // eslint-disable-next-line functional/immutable-data
        existing.canonical = word;
        // eslint-disable-next-line functional/immutable-data
        existing.canonicalCount = count;
      }
    }
  }

  const index = createEmptyWordIndex();
  for (const { canonical, totalCount } of groups.values()) {
    // eslint-disable-next-line functional/immutable-data
    index.wordCounts.set(canonical, totalCount);
    const prefix = canonical.toLowerCase().slice(0, PREFIX_KEY_LEN);
    const list = index.prefixIndex.get(prefix);
    if (list) {
      // eslint-disable-next-line functional/immutable-data
      list.push(canonical);
    } else {
      // eslint-disable-next-line functional/immutable-data
      index.prefixIndex.set(prefix, [canonical]);
    }
  }
  return index;
}

/**
 * クエリの prefix で候補を絞り込み、出現回数の降順で `limit` 件まで返す。
 *
 * - 1 文字クエリは候補が広がりすぎるので空配列を返す
 * - 2 文字クエリは prefix index の該当バケットをそのまま返す
 * - 3 文字以上は該当バケットを startsWith で再フィルタ
 *
 * 大文字小文字: クエリも単語も `toLowerCase()` 化して比較する。
 * バリアントは {@link buildWordIndex} の 2-phase で canonical 化済みなので、
 * lookup 側で重複・グループ化処理は不要。
 *
 * 出現回数が極端に少ない単語は自然に下位へ落ちて表示されないので、明示的な閾値は持たない。
 */
export function lookupSuggestions(
  index: WordIndex,
  query: string,
  limit: number,
): readonly string[] {
  if (query.length < PREFIX_KEY_LEN) return [];
  const lowerQuery = query.toLowerCase();
  const candidates =
    index.prefixIndex.get(lowerQuery.slice(0, PREFIX_KEY_LEN)) ?? [];
  const matched =
    query.length === PREFIX_KEY_LEN
      ? candidates
      : candidates.filter((w) => w.toLowerCase().startsWith(lowerQuery));
  return matched
    .filter((w) => w.toLowerCase() !== lowerQuery)
    .map((w) => [w, index.wordCounts.get(w) ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
