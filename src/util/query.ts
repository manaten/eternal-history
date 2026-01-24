export type ParsedSearchQuery = {
  term: string;
  type: "text" | "site" | "exclude";
};

/**
 * 検索クエリを解析して各タームの種類を識別します。
 *
 * サポートされる構文:
 * - 通常検索: "term"
 * - サイト検索: "site:example.com"
 * - 除外検索: "-term"
 */
export function parseSearchQuery(query: string): Array<ParsedSearchQuery> {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const parsedTerms = terms
    .map((term) => {
      // site: 構文の処理
      if (term.toLowerCase().startsWith("site:")) {
        const siteTerm = term.slice(5).toLowerCase();
        if (siteTerm.length > 0) {
          return { term: siteTerm, type: "site" } as const;
        }
        return null;
      }

      // 除外構文の処理 (-term)
      if (term.startsWith("-") && term.length > 1) {
        const excludeTerm = term.slice(1).toLowerCase();
        return { term: excludeTerm, type: "exclude" } as const;
      }

      // 通常のテキスト検索
      return { term: term.toLowerCase(), type: "text" } as const;
    })
    .filter((item) => item !== null);

  // 除外以外のタームを長い順にソート (最も長い単語でまず検索するため)
  const nonExcludeTerms = parsedTerms
    .filter((term) => term.type !== "exclude")
    .sort((a, b) => b.term.length - a.term.length);
  const excludeTerms = parsedTerms.filter((term) => term.type === "exclude");

  return [...nonExcludeTerms, ...excludeTerms];
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("parseSearchQuery", () => {
    it("should parse regular text terms", () => {
      const result = parseSearchQuery("hello world");
      expect(result).toEqual([
        { term: "hello", type: "text" },
        { term: "world", type: "text" },
      ]);
    });

    it("should parse site: terms", () => {
      const result = parseSearchQuery("site:example.com test");
      expect(result).toEqual([
        { term: "example.com", type: "site" },
        { term: "test", type: "text" },
      ]);
    });

    it("should parse exclude terms", () => {
      const result = parseSearchQuery("search -exclude -another");
      expect(result).toEqual([
        { term: "search", type: "text" },
        { term: "exclude", type: "exclude" },
        { term: "another", type: "exclude" },
      ]);
    });

    it("should handle mixed query types", () => {
      const result = parseSearchQuery("site:google.com search -ads -spam");
      expect(result).toEqual([
        { term: "google.com", type: "site" },
        { term: "search", type: "text" },
        { term: "ads", type: "exclude" },
        { term: "spam", type: "exclude" },
      ]);
    });

    it("should ignore single hyphen", () => {
      const result = parseSearchQuery("search - test");
      expect(result).toEqual([
        { term: "search", type: "text" },
        { term: "test", type: "text" },
        { term: "-", type: "text" },
      ]);
    });

    it("should sort non-exclude terms by length", () => {
      const result = parseSearchQuery("a longer short -exclude");
      expect(result).toEqual([
        { term: "longer", type: "text" },
        { term: "short", type: "text" },
        { term: "a", type: "text" },
        { term: "exclude", type: "exclude" },
      ]);
    });

    it("should handle empty query", () => {
      const result = parseSearchQuery("");
      expect(result).toEqual([]);
    });

    it("should handle only exclude terms", () => {
      const result = parseSearchQuery("-exclude -only");
      expect(result).toEqual([
        { term: "exclude", type: "exclude" },
        { term: "only", type: "exclude" },
      ]);
    });
  });
}
