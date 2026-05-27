import { describe, it, expect } from "vitest";

import {
  addText,
  buildWordIndex,
  createEmptyWordIndex,
  lookupSuggestions,
} from "./index";
import { isNoiseWord } from "./noise";

describe("isNoiseWord", () => {
  it("1 文字は全てノイズ", () => {
    expect(isNoiseWord("a")).toBe(true);
    expect(isNoiseWord("あ")).toBe(true);
    expect(isNoiseWord("漢")).toBe(true);
    expect(isNoiseWord("1")).toBe(true);
  });

  it("2 文字でアルファベット / ひらがな / カタカナのみはノイズ", () => {
    expect(isNoiseWord("ID")).toBe(true);
    expect(isNoiseWord("あの")).toBe(true);
    expect(isNoiseWord("プラ")).toBe(true);
  });

  it("漢字を含む 2 文字はノイズではない", () => {
    expect(isNoiseWord("東急")).toBe(false);
    expect(isNoiseWord("検索")).toBe(false);
    expect(isNoiseWord("aあ")).toBe(false); // 漢字以外でも非単一スクリプトなら残す
  });

  it("3 文字以上はノイズではない", () => {
    expect(isNoiseWord("web")).toBe(false);
    expect(isNoiseWord("プラス")).toBe(false);
    expect(isNoiseWord("GitHub")).toBe(false);
  });
});

describe("buildWordIndex", () => {
  it("空配列から空 index を返す", () => {
    const index = buildWordIndex([]);
    expect(index.wordCounts.size).toBe(0);
    expect(index.prefixIndex.size).toBe(0);
  });

  it("単語をカウントし prefix index を構築する", () => {
    const index = buildWordIndex([
      "GitHub Pull Request",
      "GitHub Issues",
      "GitLab",
    ]);
    expect(index.wordCounts.get("GitHub")).toBe(2);
    expect(index.wordCounts.get("GitLab")).toBe(1);
    expect(index.prefixIndex.get("Gi")).toEqual(
      expect.arrayContaining(["GitHub", "GitLab"]),
    );
  });

  it("ノイズ単語 (1文字英字) はインデックスに含まれない", () => {
    // Node の Intl.Segmenter は日本語が ICU データ不足で1文字単位に割れるため、
    // ここではセグメンタ結果が安定する英語の例で isNoiseWord 統合を検証する。
    // 日本語の検証は isNoiseWord 単体テスト側で行っている。
    const index = buildWordIndex(["a b c GitHub ID"]);
    expect(index.wordCounts.has("a")).toBe(false);
    expect(index.wordCounts.has("b")).toBe(false);
    expect(index.wordCounts.has("ID")).toBe(false);
    expect(index.wordCounts.has("GitHub")).toBe(true);
  });
});

describe("addText (差分更新)", () => {
  it("既存単語のカウントだけ増やし prefix index は重複追加しない", () => {
    const index = buildWordIndex(["GitHub"]);
    addText(index, "GitHub");
    expect(index.wordCounts.get("GitHub")).toBe(2);
    expect(index.prefixIndex.get("Gi")).toEqual(["GitHub"]);
  });

  it("新規単語は wordCounts と prefixIndex の両方に追加", () => {
    const index = createEmptyWordIndex();
    addText(index, "GitLab");
    expect(index.wordCounts.get("GitLab")).toBe(1);
    expect(index.prefixIndex.get("Gi")).toEqual(["GitLab"]);
  });
});

describe("lookupSuggestions", () => {
  const index = buildWordIndex([
    "GitHub GitHub GitHub", // GitHub: 3
    "GitLab GitLab", // GitLab: 2
    "Gist", // Gist: 1
    "Confluence Confluence", // Confluence: 2
  ]);

  it("1 文字クエリは空配列", () => {
    expect(lookupSuggestions(index, "G", 10)).toEqual([]);
  });

  it("2 文字 prefix は出現回数降順で返す", () => {
    expect(lookupSuggestions(index, "Gi", 10)).toEqual([
      "GitHub",
      "GitLab",
      "Gist",
    ]);
  });

  it("3 文字以上は startsWith で絞り込む", () => {
    expect(lookupSuggestions(index, "Git", 10)).toEqual(["GitHub", "GitLab"]);
  });

  it("limit を超える分は切り捨て", () => {
    expect(lookupSuggestions(index, "Gi", 2)).toEqual(["GitHub", "GitLab"]);
  });

  it("クエリと完全一致する単語は自身として候補から除外", () => {
    expect(lookupSuggestions(index, "GitHub", 10)).toEqual([]);
  });

  it("該当 prefix がない場合は空配列", () => {
    expect(lookupSuggestions(index, "Xy", 10)).toEqual([]);
  });
});
