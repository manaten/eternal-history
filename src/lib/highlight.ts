import { ParsedSearchQuery, parseSearchQuery } from "./query";

/**
 * テキスト内の検索クエリにマッチする部分をハイライト用のJSX要素に変換する
 * @param text - ハイライト対象のテキスト
 * @param query - 検索クエリ（複数の単語をスペースで区切ることが可能）
 * @returns ハイライト情報を含むオブジェクトの配列
 */
export const highlightText = (
  text: string,
  query: string,
  type: "url" | "title",
): { highlight: boolean; content: string }[] => {
  // クエリが空の場合はそのままテキストを返す
  if (!query.trim()) {
    return [{ highlight: false, content: text }];
  }

  const parsedQuery = parseSearchQuery(query).filter((q) => {
    if (q.type === "site") {
      return type === "url";
    }
    return true;
  });
  if (parsedQuery.length === 0) {
    return [{ highlight: false, content: text }];
  }

  // 正規表現用にエスケープする関数
  const escapeTermRegExp = (query: ParsedSearchQuery): string => {
    return query.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // 全ての検索単語を含む正規表現を作成（大文字小文字を区別しない）
  const pattern = new RegExp(
    `(${parsedQuery.map(escapeTermRegExp).join("|")})`,
    "gi",
  );

  // テキストを分割してハイライト部分を特定
  return text
    .split(pattern)
    .map((part) => {
      return {
        highlight: parsedQuery.some((w) => part.toLowerCase() === w.term),
        content: part,
      };
    })
    .filter((c) => c.content !== "");
};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("highlightText", () => {
    it("should return original text when query is empty", () => {
      const result = highlightText("Hello world", "", "title");
      expect(result).toEqual([{ content: "Hello world", highlight: false }]);
    });

    it("should return original text when query is only whitespace", () => {
      const result = highlightText("Hello world", "   ", "title");
      expect(result).toEqual([{ content: "Hello world", highlight: false }]);
    });

    it("should highlight single word match", () => {
      const result = highlightText("Hello world", "hello", "title");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        highlight: true,
        content: "Hello",
      });
      expect(result[1]).toEqual({
        highlight: false,
        content: " world",
      });
    });

    it("should highlight multiple word matches", () => {
      const result = highlightText(
        "Hello beautiful world",
        "hello world",
        "title",
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        highlight: true,
        content: "Hello",
      });
      expect(result[2]).toEqual({
        highlight: true,
        content: "world",
      });
    });

    it("should handle case insensitive matching", () => {
      const result = highlightText("GitHub Repository", "githuB rePo", "title");
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        highlight: true,
        content: "GitHub",
      });
      expect(result[2]).toEqual({
        highlight: true,
        content: "Repo",
      });
    });

    it("should handle partial word matches", () => {
      const result = highlightText("JavaScript programming", "script", "title");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        highlight: true,
        content: "Script",
      });
    });

    it("should handle special regex characters in query", () => {
      const result = highlightText("test@example.com", "@example", "title");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        highlight: true,
        content: "@example",
      });
    });

    it("should handle no matches", () => {
      const result = highlightText("Hello world", "xyz", "title");
      expect(result).toEqual([{ content: "Hello world", highlight: false }]);
    });

    it("should handle multiple occurrences of same word", () => {
      const result = highlightText("test test test", "test", "title");
      expect(result).toHaveLength(5);
      expect(result.filter((part) => part.highlight)).toHaveLength(3);
    });

    it("should handle site: queries", () => {
      const result = highlightText(
        "Visit example.com for more info",
        "site:example.com",
        "url",
      );
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        highlight: true,
        content: "example.com",
      });
    });

    it("should not highlight site: queries in title", () => {
      const result = highlightText(
        "Visit example.com for more info",
        "site:example.com",
        "title",
      );
      expect(result).toHaveLength(1);
      expect(result.filter((part) => part.highlight)).toHaveLength(0);
    });
  });
}
