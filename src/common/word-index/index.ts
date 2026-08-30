import { isNoiseWord } from "./noise";
import { WordIndex } from "./types";

export { isNoiseWord } from "./noise";
export type { WordIndex } from "./types";

const JA_SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

/**
 * prefix index のキーに使う先頭文字数。
 * 1 にするとバケットが大きくなるが (英字 1 文字あたり数百語規模)、lookup は
 * バケット内の filter + sort で μs オーダーに収まるので問題ない。
 * 1 文字段階からのサジェストを成立させるためにこの値を採用している。
 */
const PREFIX_KEY_LEN = 1;

export function createEmptyWordIndex(): WordIndex {
  return {
    wordCounts: new Map(),
    prefixIndex: new Map(),
  };
}

/**
 * 単語 → 出現回数のペア列から WordIndex を構築する。
 *
 * prefixIndex は wordCounts からの派生データなので、wordCounts を確定させてから
 * 一括で再導出する。これにより 2 つの Map の整合が常に保たれる: 入力に重複キーが
 * あっても wordCounts 側の上書きで畳まれた最終キー集合から prefixIndex を作るため、
 * 「prefixIndex にだけ重複が残る」破綻が構造的に起きない。
 *
 * 永続キャッシュの復元 (infra 側の deserialize) はこの関数を通すことで、
 * prefixIndex の作り方 (PREFIX_KEY_LEN 等) という index の内部構造を infra に
 * 漏らさずに済む。
 */
export function createWordIndex(
  counts: Iterable<readonly [string, number]>,
): WordIndex {
  const index = createEmptyWordIndex();
  for (const [word, count] of counts) {
    // eslint-disable-next-line functional/immutable-data
    index.wordCounts.set(word, count);
  }
  for (const word of index.wordCounts.keys()) {
    addToPrefixIndex(index, word);
  }
  return index;
}

function addToPrefixIndex(index: WordIndex, canonical: string): void {
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

/**
 * テキスト群から WordIndex を構築する。
 *
 * 1 パスで `Map<lowerKey, Map<exactCase, count>>` に集約し、グループごとに最頻
 * ケースを canonical として選んで合算カウントを格納する。これで:
 *   - 表示形が決定的 (= 最頻ケース)
 *   - 同じ lower の case 順列で prefixIndex バケットが膨らまない (canonical 1 件のみ)
 *   - 挿入ホットパスは O(1) (Map 操作のみ)、全体 O(totalTokens + uniqueLowers)
 */
export function buildWordIndex(texts: readonly string[]): WordIndex {
  // lower → (exact case → count)
  const groups = new Map<string, Map<string, number>>();
  for (const text of texts) {
    for (const seg of JA_SEGMENTER.segment(text)) {
      if (!seg.isWordLike) continue;
      const word = seg.segment;
      if (isNoiseWord(word)) continue;
      const lower = word.toLowerCase();
      const inner = groups.get(lower);
      if (inner) {
        // eslint-disable-next-line functional/immutable-data
        inner.set(word, (inner.get(word) ?? 0) + 1);
      } else {
        // eslint-disable-next-line functional/immutable-data
        groups.set(lower, new Map([[word, 1]]));
      }
    }
  }

  const counts = new Map<string, number>();
  for (const variants of groups.values()) {
    // 最頻ケースを canonical に。同点は先に encounter したものを維持する。
    const { canonical, totalCount } = [...variants].reduce<{
      canonical: string;
      canonicalCount: number;
      totalCount: number;
    }>(
      (acc, [variant, count]) => ({
        canonical: count > acc.canonicalCount ? variant : acc.canonical,
        canonicalCount: Math.max(count, acc.canonicalCount),
        totalCount: acc.totalCount + count,
      }),
      { canonical: "", canonicalCount: -1, totalCount: 0 },
    );
    // eslint-disable-next-line functional/immutable-data
    counts.set(canonical, totalCount);
  }
  // prefixIndex の導出は createWordIndex に委譲する (整合を 1 箇所に集約)。
  return createWordIndex(counts);
}

/**
 * クエリの prefix で候補を絞り込み、出現回数の降順で `limit` 件まで返す。
 *
 * - 1 文字クエリは prefix index の該当バケットをそのまま返す (= 全候補)
 * - 2 文字以上は該当バケットを startsWith で再フィルタ
 *
 * 大文字小文字: クエリも単語も `toLowerCase()` 化して比較する。
 * バリアントは {@link buildWordIndex} で canonical 化済みなので、lookup 側で
 * 重複・グループ化処理は不要。
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
    .map((w) => [w, index.wordCounts.get(w) ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
