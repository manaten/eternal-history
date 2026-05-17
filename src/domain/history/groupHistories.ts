import { GroupingOptions } from "./types/GroupingOptions";
import { HistoryItem } from "./types/HistoryItem";
import { uniqBy } from "../../util/array";

/**
 * 同一 URL / 同一タイトルでグルーピングし、最新のものだけを残します。
 */
export function groupHistories(
  items: HistoryItem[],
  options?: GroupingOptions,
): HistoryItem[] {
  if (!options?.groupByUrl && !options?.groupByTitle) {
    return items;
  }

  const sorted = [...items].sort((a, b) => b.lastVisitTime - a.lastVisitTime);

  const afterUrlGrouping = options.groupByUrl
    ? uniqBy(sorted, (item) => item.url)
    : sorted;

  const afterTitleGrouping = options.groupByTitle
    ? uniqBy(afterUrlGrouping, (item) => item.title || "")
    : afterUrlGrouping;

  return afterTitleGrouping;
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

  describe("groupHistories", () => {
    it("returns items as-is when no grouping requested", () => {
      const items = [
        makeItem({ url: "https://a.com", lastVisitTime: 1 }),
        makeItem({ url: "https://a.com", lastVisitTime: 2 }),
      ];
      expect(groupHistories(items)).toEqual(items);
      expect(groupHistories(items, {})).toEqual(items);
    });

    it("keeps the newest entry per URL when groupByUrl", () => {
      const items = [
        makeItem({ url: "https://a.com", title: "old", lastVisitTime: 1 }),
        makeItem({ url: "https://a.com", title: "new", lastVisitTime: 2 }),
        makeItem({ url: "https://b.com", title: "other", lastVisitTime: 1 }),
      ];
      const result = groupHistories(items, { groupByUrl: true });
      expect(result).toHaveLength(2);
      expect(result.find((i) => i.url === "https://a.com")?.title).toBe("new");
    });

    it("keeps the newest entry per title when groupByTitle", () => {
      const items = [
        makeItem({ url: "https://a.com", title: "Same", lastVisitTime: 1 }),
        makeItem({ url: "https://b.com", title: "Same", lastVisitTime: 2 }),
        makeItem({ url: "https://c.com", title: "Other", lastVisitTime: 1 }),
      ];
      const result = groupHistories(items, { groupByTitle: true });
      expect(result).toHaveLength(2);
      expect(result.find((i) => i.title === "Same")?.url).toBe("https://b.com");
    });
  });
}
