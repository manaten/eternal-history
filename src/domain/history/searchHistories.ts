import { HistoryItem } from "./HistoryItem";
import { HistoryStore } from "./HistoryStore";
import { parseSearchQuery } from "./SearchQuery";
import { filterByTerms, groupHistories } from "./history-filter";

export interface SearchOptions {
  groupByUrl?: boolean;
  groupByTitle?: boolean;
  /** 結果の最大件数。lastVisitTime 降順で先頭から N 件を返す (未指定時は無制限) */
  limit?: number;
}

/**
 * 履歴を検索するユースケース。
 *
 * 実装側 (HistoryStore) の一次フィルタで候補を絞り込んだ後、
 * ドメインの純粋ロジック (filterByTerms / groupHistories) で
 * フィルタリング・グルーピング・並び替え・件数制限を行います。
 *
 * クエリが空、または除外タームしか含まれない場合は空配列を返します。
 */
export async function searchHistories(
  store: HistoryStore,
  query: string,
  options?: SearchOptions,
): Promise<HistoryItem[]> {
  const limit = options?.limit ?? Infinity;

  const parsedTerms = parseSearchQuery(query);
  const firstNonExcludeTerm = parsedTerms.find(
    (term) => term.type !== "exclude",
  );
  if (!firstNonExcludeTerm) {
    return [];
  }

  const candidates = await store.searchCandidates(firstNonExcludeTerm.term);
  const filtered = filterByTerms(candidates, parsedTerms);
  const grouped = groupHistories(filtered, options);

  return [...grouped]
    .sort((a, b) => b.lastVisitTime - a.lastVisitTime)
    .slice(0, limit);
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

  const makeFakeStore = (items: HistoryItem[]): HistoryStore => ({
    initialize: async () => {},
    insert: async () => {},
    delete: async () => {},
    getRecent: async () => [],
    searchCandidates: async (term) =>
      items.filter((item) =>
        `${item.title} ${item.url}`.toLowerCase().includes(term),
      ),
  });

  describe("searchHistories", () => {
    it("returns [] for empty query", async () => {
      const store = makeFakeStore([makeItem({})]);
      expect(await searchHistories(store, "")).toEqual([]);
      expect(await searchHistories(store, "   ")).toEqual([]);
    });

    it("returns [] when only exclude terms are provided", async () => {
      const store = makeFakeStore([makeItem({ title: "Google" })]);
      expect(await searchHistories(store, "-ads -spam")).toEqual([]);
    });

    it("AND-filters and sorts by lastVisitTime desc", async () => {
      const store = makeFakeStore([
        makeItem({
          url: "https://a.com",
          title: "Google Search",
          lastVisitTime: 1,
        }),
        makeItem({
          url: "https://b.com",
          title: "Google Maps",
          lastVisitTime: 2,
        }),
        makeItem({
          url: "https://c.com",
          title: "Yahoo Search",
          lastVisitTime: 3,
        }),
      ]);
      const result = await searchHistories(store, "google search");
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://a.com");
    });

    it("applies limit after sorting", async () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        makeItem({
          url: `https://e.com/${i}`,
          title: `Truncate Test ${i}`,
          lastVisitTime: i,
        }),
      );
      const store = makeFakeStore(items);
      const result = await searchHistories(store, "truncate", { limit: 2 });
      expect(result).toHaveLength(2);
      expect(result[0]?.lastVisitTime).toBe(4);
      expect(result[1]?.lastVisitTime).toBe(3);
    });

    it("applies grouping options", async () => {
      const store = makeFakeStore([
        makeItem({
          url: "https://a.com",
          title: "Same",
          lastVisitTime: 1,
        }),
        makeItem({
          url: "https://a.com",
          title: "Same",
          lastVisitTime: 2,
        }),
      ]);
      const result = await searchHistories(store, "same", { groupByUrl: true });
      expect(result).toHaveLength(1);
      expect(result[0]?.lastVisitTime).toBe(2);
    });
  });
}
