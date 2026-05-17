import { HistoryItem, ParsedSearchQuery } from "./types";

/**
 * 解析済みクエリのタームをすべて満たす履歴のみを残します (AND 検索)。
 *
 * - text: title または url 全体への部分一致
 * - site: hostname への部分一致
 * - exclude: 該当する text が含まれていれば除外
 */
export function filterByTerms(
  items: HistoryItem[],
  terms: ParsedSearchQuery[],
): HistoryItem[] {
  return items.filter((item) => {
    const searchText = `${item.title} ${item.url}`.toLowerCase();

    return terms.every((parsedTerm) => {
      if (parsedTerm.type === "exclude") {
        return !searchText.includes(parsedTerm.term);
      }

      if (parsedTerm.type === "site") {
        try {
          const url = new URL(item.url);
          return url.hostname.includes(parsedTerm.term);
        } catch {
          return false;
        }
      }

      return searchText.includes(parsedTerm.term);
    });
  });
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const makeItem = (overrides: Partial<HistoryItem>): HistoryItem => ({
    id: "x",
    url: "https://example.com",
    title: "Example",
    visitCount: 1,
    lastVisitTime: 0,
    domain: "example.com",
    ...overrides,
  });

  describe("filterByTerms", () => {
    it("matches text terms against title and url (AND)", () => {
      const items = [
        makeItem({ url: "https://a.com", title: "Google Search" }),
        makeItem({ url: "https://b.com", title: "Google Maps" }),
        makeItem({ url: "https://c.com", title: "Yahoo Search" }),
      ];
      const result = filterByTerms(items, [
        { term: "google", type: "text" },
        { term: "search", type: "text" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Google Search");
    });

    it("filters by site: hostname", () => {
      const items = [
        makeItem({ url: "https://maps.google.com" }),
        makeItem({ url: "https://yahoo.com" }),
      ];
      const result = filterByTerms(items, [
        { term: "google.com", type: "site" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://maps.google.com");
    });

    it("excludes terms with type=exclude", () => {
      const items = [
        makeItem({ url: "https://example.com/search", title: "Search" }),
        makeItem({ url: "https://example.com/ads", title: "Ads" }),
      ];
      const result = filterByTerms(items, [
        { term: "example", type: "text" },
        { term: "ads", type: "exclude" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://example.com/search");
    });

    it("returns empty when site: matches no hostname", () => {
      const items = [makeItem({ url: "https://example.com" })];
      const result = filterByTerms(items, [{ term: "nope.com", type: "site" }]);
      expect(result).toEqual([]);
    });

    it("treats invalid URLs as non-matching for site:", () => {
      const items = [makeItem({ url: "not-a-url" })];
      const result = filterByTerms(items, [{ term: "anything", type: "site" }]);
      expect(result).toEqual([]);
    });
  });
}
