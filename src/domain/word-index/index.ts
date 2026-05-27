import { isNoiseWord } from "./noise";
import { WordIndex, WORD_INDEX_SCHEMA_VERSION } from "./types";

export { isNoiseWord } from "./noise";
export type { WordIndex } from "./types";
export { WORD_INDEX_SCHEMA_VERSION } from "./types";

const JA_SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

/** prefix index のキーに使う先頭文字数。1 だと候補が爆発するので 2 を採用。 */
const PREFIX_KEY_LEN = 2;

export function createEmptyWordIndex(): WordIndex {
  return {
    schemaVersion: WORD_INDEX_SCHEMA_VERSION,
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

function addWord(index: WordIndex, word: string): void {
  const prev = index.wordCounts.get(word);
  // eslint-disable-next-line functional/immutable-data
  index.wordCounts.set(word, (prev ?? 0) + 1);

  // 新規単語のみ prefix index に追加 (既存単語は既に登録済み)
  if (prev === undefined) {
    const prefix = word.slice(0, PREFIX_KEY_LEN);
    const list = index.prefixIndex.get(prefix);
    if (list) {
      // eslint-disable-next-line functional/immutable-data
      list.push(word);
    } else {
      // eslint-disable-next-line functional/immutable-data
      index.prefixIndex.set(prefix, [word]);
    }
  }
}

/**
 * テキスト群からゼロから WordIndex を構築する。
 * フル再構築 (初回 / スキーマ不一致 / ユーザー手動再構築) で使う。
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
 * - 2 文字クエリは prefix index の該当バケットをそのまま返す (フィルタ不要で最速)
 * - 3 文字以上は該当バケットを startsWith で再フィルタ
 *
 * 出現回数が極端に少ない単語は自然に下位へ落ちて表示されないので、明示的な閾値は持たない。
 */
export function lookupSuggestions(
  index: WordIndex,
  query: string,
  limit: number,
): readonly string[] {
  if (query.length < PREFIX_KEY_LEN) return [];
  const candidates =
    index.prefixIndex.get(query.slice(0, PREFIX_KEY_LEN)) ?? [];
  const matched =
    query.length === PREFIX_KEY_LEN
      ? candidates
      : candidates.filter((w) => w.startsWith(query));
  // 完全一致の単語自身は候補から除外 (ユーザーが既に打ち切っているため)
  const withoutSelf = matched.filter((w) => w !== query);
  return withoutSelf
    .map((w) => [w, index.wordCounts.get(w) ?? 0] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
