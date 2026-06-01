import { describe, it, expect } from "vitest";

import { buildWordIndex, lookupSuggestions } from "./index";
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
    expect(index.prefixIndex.get("g")).toEqual(
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

describe("lookupSuggestions", () => {
  const index = buildWordIndex([
    "GitHub GitHub GitHub", // GitHub: 3
    "GitLab GitLab", // GitLab: 2
    "Gist", // Gist: 1
    "Confluence Confluence", // Confluence: 2
  ]);

  it("空文字クエリは空配列", () => {
    expect(lookupSuggestions(index, "", 10)).toEqual([]);
  });

  it("1 文字 prefix は出現回数降順で全候補を返す", () => {
    expect(lookupSuggestions(index, "G", 10)).toEqual([
      "GitHub",
      "GitLab",
      "Gist",
    ]);
  });

  it("2 文字 prefix は出現回数降順で startsWith フィルタする", () => {
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

  it("クエリと完全一致する単語も候補として返す (除外しない)", () => {
    expect(lookupSuggestions(index, "GitHub", 10)).toEqual(["GitHub"]);
  });

  it("該当 prefix がない場合は空配列", () => {
    expect(lookupSuggestions(index, "Xy", 10)).toEqual([]);
  });

  describe("大文字小文字無視", () => {
    it("小文字クエリで大文字始まりの単語にマッチする", () => {
      expect(lookupSuggestions(index, "git", 10)).toEqual(["GitHub", "GitLab"]);
    });

    it("大文字クエリで小文字始まりの単語にもマッチする", () => {
      const caseIndex = buildWordIndex(["github github github gitlab"]);
      expect(lookupSuggestions(caseIndex, "GIT", 10)).toEqual([
        "github",
        "gitlab",
      ]);
    });

    it("大文字小文字違いのバリアントは合算して 1 件に畳まれる", () => {
      // GitHub が 3 回、github が 2 回。合算 5 回で 1 件、表示は頻度の高い "GitHub"
      const mixedIndex = buildWordIndex(["GitHub GitHub GitHub github github"]);
      const results = lookupSuggestions(mixedIndex, "git", 10);
      expect(results).toEqual(["GitHub"]);
    });

    it("最頻ケースが canonical として採用される (build 順序非依存)", () => {
      // 入力順序を反転しても結果が変わらないことで「最頻」基準を確認
      const a = buildWordIndex(["github GitHub GitHub GitHub GitHub github"]);
      const b = buildWordIndex(["GitHub github github GitHub GitHub GitHub"]);
      // どちらも GitHub 4 回 / github 2 回 → canonical=GitHub, 合算 6
      expect(a.wordCounts.get("GitHub")).toBe(6);
      expect(a.wordCounts.has("github")).toBe(false);
      expect(b.wordCounts.get("GitHub")).toBe(6);
      expect(b.wordCounts.has("github")).toBe(false);
    });

    it("クエリと大文字小文字違いの完全一致バリアントも候補として返す", () => {
      const mixedIndex = buildWordIndex(["GitHub GitHub"]);
      expect(lookupSuggestions(mixedIndex, "github", 10)).toEqual(["GitHub"]);
      expect(lookupSuggestions(mixedIndex, "GITHUB", 10)).toEqual(["GitHub"]);
    });
  });
});
