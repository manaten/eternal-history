const RE_ALPHA_ONLY = /^[a-zA-Z]+$/;
// U+3040–U+309F (Hiragana block)
const RE_HIRAGANA_ONLY = /^[぀-ゟ]+$/;
// U+30A0–U+30FF (Katakana block) + U+FF66–U+FF9F (Halfwidth Katakana)
const RE_KATAKANA_ONLY = /^[゠-ヿｦ-ﾟ]+$/;

/**
 * サジェスト候補としてノイズとみなすかを判定する。
 *
 * - 1 文字単語 (助詞・記号・単漢字) は除外
 * - 2 文字でアルファベット / ひらがな / カタカナのみの単語は除外
 *   (例: "に", "ID", "あの", "プラ" は弾く)
 * - 漢字を 1 文字でも含む 2 文字単語は残す (例: "東急", "検索")
 * - 3 文字以上はそのまま残す
 *
 * このルールを変更したら {@link WORD_INDEX_SCHEMA_VERSION} をインクリメントすること。
 */
export function isNoiseWord(word: string): boolean {
  if (word.length <= 1) return true;
  if (word.length === 2) {
    return (
      RE_ALPHA_ONLY.test(word) ||
      RE_HIRAGANA_ONLY.test(word) ||
      RE_KATAKANA_ONLY.test(word)
    );
  }
  return false;
}
