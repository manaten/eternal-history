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
 * 1 つのテキストを分かち書きしてインデックスに加算する。
 * ノイズ単語はスキップ。`index` を破壊的に更新する (差分更新のホットパスのため、
 * 毎回 Map を作り直すコストを避ける)。
 */
export function addText(index: WordIndex, text: string): void {
  for (const seg of JA_SEGMENTER.segment(text)) {
    if (!seg.isWordLike) continue;
    const word = seg.segment;
    if (isNoiseWord(word)) continue;
    addWord(index, word);
  }
}

/**
 * 同じ単語の大文字小文字違いバリアント (例: "GitHub" / "github") は 1 つの canonical
 * (先に登録された形) にまとめる。これにより:
 *   - prefixIndex のバケットが case 順列の数だけ膨らむのを防ぐ
 *   - 出現回数が正しく合算される
 *   - lookupSuggestions 側でグループ化処理が不要になる
 * 日本語は toLowerCase() で変化しないので影響なし。
 */
function addWord(index: WordIndex, word: string): void {
  const lower = word.toLowerCase();
  const prefix = lower.slice(0, PREFIX_KEY_LEN);
  const list = index.prefixIndex.get(prefix);
  const canonical = list?.find((w) => w.toLowerCase() === lower) ?? word;

  const prev = index.wordCounts.get(canonical);
  // eslint-disable-next-line functional/immutable-data
  index.wordCounts.set(canonical, (prev ?? 0) + 1);

  if (prev === undefined) {
    if (list) {
      // eslint-disable-next-line functional/immutable-data
      list.push(canonical);
    } else {
      // eslint-disable-next-line functional/immutable-data
      index.prefixIndex.set(prefix, [canonical]);
    }
  }
}

/**
 * テキスト群からゼロから WordIndex を構築する。
 * MV3 SW の起動 (or wake) 時 / ユーザー手動再構築で使う。
 */
export function buildWordIndex(texts: readonly string[]): WordIndex {
  const index = createEmptyWordIndex();
  for (const text of texts) {
    addText(index, text);
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
 * 大文字小文字: クエリも単語も `toLowerCase()` してから比較する。
 * 大文字小文字違いのバリアントは {@link addWord} で canonical 化済みなので、
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
