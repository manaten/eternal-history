import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  afterAll,
} from "vitest";

import {
  bookmarkHistoryStore,
  ROOT_FOLDER_NAME,
  resetStorageForTesting,
} from "./index";
import { searchHistories } from "../../domain/history/searchHistories";
import { HistoryItem } from "../../domain/history/types/HistoryItem";
import {
  setupChromeBookmarksMock,
  resetChromeBookmarksMock,
  mockBookmarkUtils,
  mockChromeHistory,
} from "../chrome/__mocks__/chrome_bookmarks.mock";

const insertHistories = (...items: HistoryItem[]) =>
  bookmarkHistoryStore.insert(items);
const getRecentHistories = (days = 3) => bookmarkHistoryStore.getRecent(days);

describe("bookmarkHistoryStore", () => {
  beforeEach(() => {
    setupChromeBookmarksMock();
    resetChromeBookmarksMock();
    vi.useFakeTimers();
    // Set a fixed date for all tests
    vi.setSystemTime(new Date(2024, 0, 15, 23, 46, 40)); // 2024-01-15 23:46:40

    // Fix timezone to UTC for consistent testing across environments
    vi.stubEnv("TZ", "UTC");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("initialize", () => {
    it("should create root folder when it doesn't exist", async () => {
      expect(mockBookmarkUtils.getAllMockBookmarks()).toEqual([]);
      await bookmarkHistoryStore.initialize();
      expect(mockBookmarkUtils.getAllMockBookmarks()).toEqual([
        expect.objectContaining({
          title: ROOT_FOLDER_NAME,
          id: expect.any(String),
          parentId: undefined,
        }),
      ]);
    });

    it("should use existing root folder when it exists", async () => {
      mockBookmarkUtils.addMockBookmark({
        id: "existing-root",
        title: ROOT_FOLDER_NAME,
      });

      const bookmarksBeforeInit = mockBookmarkUtils.getAllMockBookmarks();
      await bookmarkHistoryStore.initialize();
      const bookmarksAfterInit = mockBookmarkUtils.getAllMockBookmarks();

      expect(bookmarksAfterInit).toEqual(bookmarksBeforeInit);
      expect(bookmarksAfterInit).toHaveLength(1);
      expect(bookmarksAfterInit[0]).toMatchObject({
        id: "existing-root",
        title: ROOT_FOLDER_NAME,
      });
    });
  });

  describe("insert", () => {
    beforeEach(async () => {
      resetStorageForTesting();
      await bookmarkHistoryStore.initialize();
    });

    it("should throw error when storage is not initialized", async () => {
      resetStorageForTesting();

      const historyItem: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Example",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "example.com",
      };

      await expect(insertHistories(historyItem)).rejects.toThrow(
        "Storage not initialized",
      );
    });

    it("should create folder hierarchy and insert bookmark", async () => {
      const historyItem: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Example Site",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "example.com",
      };

      await insertHistories(historyItem);

      const bookmarks = mockBookmarkUtils.getAllMockBookmarks();
      expect(bookmarks).toHaveLength(6);

      const rootFolder = bookmarks.find((b) => b.title === ROOT_FOLDER_NAME);
      expect(rootFolder).toBeDefined();

      const yearFolder = bookmarks.find(
        (b) => b.title === "2024" && b.parentId === rootFolder?.id,
      );
      expect(yearFolder).toBeDefined();

      const monthFolder = bookmarks.find(
        (b) => b.title === "01" && b.parentId === yearFolder?.id,
      );
      expect(monthFolder).toBeDefined();

      const dayFolder = bookmarks.find(
        (b) => b.title === "15" && b.parentId === monthFolder?.id,
      );
      expect(dayFolder).toBeDefined();

      const hourFolder = bookmarks.find(
        (b) => b.title === "10" && b.parentId === dayFolder?.id,
      );
      expect(hourFolder).toBeDefined();

      const bookmark = bookmarks.find(
        (b) => b.url === "https://example.com" && b.parentId === hourFolder?.id,
      );
      expect(bookmark).toBeDefined();
      expect(bookmark?.url).toBe("https://example.com");
      expect(bookmark?.title).toBe(
        'Example Site 💾{"v":1,"t":' +
          new Date(2024, 0, 15, 10, 30, 0).getTime() +
          ',"vc":1}',
      );
    });

    it("should update existing bookmark title when URL matches", async () => {
      const initialItem: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Old Title",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "example.com",
      };

      await insertHistories(initialItem);
      const bookmarksAfterFirst = mockBookmarkUtils.getAllMockBookmarks();
      const initialBookmarkCount = bookmarksAfterFirst.length;

      const updatedItem: HistoryItem = {
        id: "2",
        url: "https://example.com",
        title: "Updated Title",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "example.com",
      };

      await insertHistories(updatedItem);
      const bookmarksAfterUpdate = mockBookmarkUtils.getAllMockBookmarks();

      expect(bookmarksAfterUpdate).toHaveLength(initialBookmarkCount);

      const updatedBookmark = bookmarksAfterUpdate.find(
        (b) => b.url === "https://example.com",
      );
      expect(updatedBookmark).toBeDefined();
      expect(updatedBookmark?.title).toBe(
        'Updated Title 💾{"v":1,"t":' +
          new Date(2024, 0, 15, 10, 30, 0).getTime() +
          ',"vc":1}',
      );
    });

    it("should handle multiple history items", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://site1.com",
          title: "Site 1",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "site1.com",
        },
        {
          id: "2",
          url: "https://site2.com",
          title: "Site 2",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 15, 0).getTime(),
          domain: "site2.com",
        },
      ];

      await insertHistories(...historyItems);

      const bookmarks = mockBookmarkUtils.getAllMockBookmarks();
      expect(bookmarks).toHaveLength(8);

      const site1Bookmark = bookmarks.find(
        (b) => b.url === "https://site1.com",
      );
      expect(site1Bookmark).toBeDefined();
      expect(site1Bookmark?.title).toBe(
        'Site 1 💾{"v":1,"t":' +
          new Date(2024, 0, 15, 10, 30, 0).getTime() +
          ',"vc":1}',
      );

      const site2Bookmark = bookmarks.find(
        (b) => b.url === "https://site2.com",
      );
      expect(site2Bookmark).toBeDefined();
      expect(site2Bookmark?.title).toBe(
        'Site 2 💾{"v":1,"t":' +
          new Date(2024, 0, 15, 11, 15, 0).getTime() +
          ',"vc":1}',
      );

      expect(bookmarks.find((b) => b.title === "2024")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "01")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "15")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "10")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "11")).toBeDefined();
    });

    it("should embed correct metadata format in bookmark titles", async () => {
      const testItem: HistoryItem = {
        id: "test-id",
        url: "https://test.example.com",
        title: "Test Site Title",
        visitCount: 3,
        lastVisitTime: new Date(2009, 1, 13, 23, 31, 30, 123).getTime(),
        domain: "test.example.com",
      };

      await insertHistories(testItem);
      const bookmarks = mockBookmarkUtils.getAllMockBookmarks();

      const testBookmark = bookmarks.find(
        (b) => b.url === "https://test.example.com",
      );

      expect(testBookmark).toBeDefined();
      expect(testBookmark?.title).toBe(
        'Test Site Title 💾{"v":1,"t":' +
          new Date(2009, 1, 13, 23, 31, 30, 123).getTime() +
          ',"vc":3}',
      );
    });
  });

  describe("searchHistories (integration via store)", () => {
    beforeEach(async () => {
      await bookmarkHistoryStore.initialize();
    });

    it("should return empty array for empty query", async () => {
      const result = await searchHistories(bookmarkHistoryStore, "   ");
      expect(result).toEqual([]);
    });

    it("should search bookmarks by single term", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com",
          title: "Google Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/maps",
          title: "Google Maps",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com",
          title: "Yahoo Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "yahoo.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(bookmarkHistoryStore, "google");
      expect(result).toHaveLength(2);
      const googleSearch = result.find((i) => i.url === "https://google.com");
      expect(googleSearch).toMatchObject({
        url: "https://google.com",
        title: "Google Search",
        domain: "google.com",
      });
      const googleMaps = result.find(
        (i) => i.url === "https://google.com/maps",
      );
      expect(googleMaps).toMatchObject({
        url: "https://google.com/maps",
        title: "Google Maps",
        domain: "google.com",
      });
    });

    it("should filter results by multiple terms (AND search)", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com",
          title: "Google Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/maps",
          title: "Google Maps",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com",
          title: "Yahoo Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "yahoo.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "google search",
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        url: "https://google.com",
        title: "Google Search Engine",
      });
    });

    it("should only return bookmarks under root folder", async () => {
      await insertHistories({
        id: "1",
        url: "https://inside.com",
        title: "Inside Bookmark",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "inside.com",
      });

      mockBookmarkUtils.addMockBookmark({
        id: "outside",
        title: "Outside Bookmark",
        url: "https://outside.com",
        parentId: "other-parent",
      });

      const resultInside = await searchHistories(
        bookmarkHistoryStore,
        "inside",
      );
      const resultOutside = await searchHistories(
        bookmarkHistoryStore,
        "outside",
      );

      expect(resultInside).toHaveLength(1);
      expect(resultInside[0]).toMatchObject({
        url: "https://inside.com",
        title: "Inside Bookmark",
      });

      expect(resultOutside).toEqual([]);
    });

    it("should search by site: syntax for domain matching", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com/search",
          title: "Google Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://maps.google.com",
          title: "Google Maps",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "maps.google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com",
          title: "Yahoo Homepage",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "yahoo.com",
        },
        {
          id: "4",
          url: "https://other.com/google.com",
          title: "other Homepage (Google Link)",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "other.com",
        },
        {
          id: "5",
          url: "https://other.com",
          title: "other Homepage (google.com)",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "other.com",
        },
      ];
      await insertHistories(...historyItems);

      const googleResult = await searchHistories(
        bookmarkHistoryStore,
        "site:google.com",
      );
      expect(googleResult).toHaveLength(2);
      expect(googleResult.map((r) => r.url)).toContain(
        "https://google.com/search",
      );
      expect(googleResult.map((r) => r.url)).toContain(
        "https://maps.google.com",
      );

      const yahoResult = await searchHistories(
        bookmarkHistoryStore,
        "site:yahoo",
      );
      expect(yahoResult).toHaveLength(1);
      expect(yahoResult[0]?.url).toBe("https://yahoo.com");
    });

    it("should combine site: search with regular search terms", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com/search",
          title: "Google Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/maps",
          title: "Google Maps",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com",
          title: "Yahoo Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "yahoo.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "site:google.com search",
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        url: "https://google.com/search",
        title: "Google Search Engine",
      });
    });

    it("should handle multiple site: terms", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com",
          title: "Google",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://search.yahoo.com",
          title: "Yahoo Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "search.yahoo.com",
        },
        {
          id: "3",
          url: "https://example.com",
          title: "Example",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "example.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "site:search site:yahoo",
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://search.yahoo.com");
    });

    it("should return empty array when site: matches no domains", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com",
          title: "Google",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "site:nonexistent.com",
      );
      expect(result).toEqual([]);
    });

    it("should handle invalid URLs gracefully in site: search", async () => {
      mockBookmarkUtils.addMockBookmark({
        id: "invalid",
        title: "Invalid URL Bookmark",
        url: "not-a-valid-url",
        parentId: "some-parent",
      });

      const result = await searchHistories(
        bookmarkHistoryStore,
        "site:example.com",
      );
      expect(result).toEqual([]);
    });

    it("should support exclude search with - prefix", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com/search",
          title: "Google Search Results",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/ads",
          title: "Google Ads Dashboard",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://google.com/analytics",
          title: "Google Analytics",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "google.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(bookmarkHistoryStore, "google -ads");
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.url)).toContain("https://google.com/search");
      expect(result.map((r) => r.url)).toContain(
        "https://google.com/analytics",
      );
      expect(result.map((r) => r.url)).not.toContain("https://google.com/ads");
    });

    it("should support multiple exclude terms", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://example.com/search",
          title: "Search Page",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "example.com",
        },
        {
          id: "2",
          url: "https://example.com/ads",
          title: "Ads Page",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "example.com",
        },
        {
          id: "3",
          url: "https://example.com/spam",
          title: "Spam Content",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "example.com",
        },
        {
          id: "4",
          url: "https://example.com/content",
          title: "Good Content",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 13, 0, 0).getTime(),
          domain: "example.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "example -ads -spam",
      );
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.url)).toContain("https://example.com/search");
      expect(result.map((r) => r.url)).toContain("https://example.com/content");
    });

    it("should return empty array when only exclude terms are provided", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://example.com",
          title: "Example",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "example.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(bookmarkHistoryStore, "-ads -spam");
      expect(result).toEqual([]);
    });

    it("should combine site: and exclude searches", async () => {
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com/search",
          title: "Google Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/ads",
          title: "Google Ads",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com/search",
          title: "Yahoo Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
          domain: "yahoo.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await searchHistories(
        bookmarkHistoryStore,
        "site:google.com -ads",
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://google.com/search");
    });

    describe("grouping options", () => {
      it("should group results by URL when groupByUrl is true", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://example.com",
            title: "Example - Old Visit",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "2",
            url: "https://example.com",
            title: "Example - New Visit",
            visitCount: 2,
            lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "3",
            url: "https://other.com",
            title: "Other Site",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
            domain: "other.com",
          },
        ];
        await insertHistories(...historyItems);

        const resultWithoutGrouping = await searchHistories(
          bookmarkHistoryStore,
          "example",
        );
        expect(resultWithoutGrouping).toHaveLength(2);

        const resultWithGrouping = await searchHistories(
          bookmarkHistoryStore,
          "example",
          { groupByUrl: true },
        );
        expect(resultWithGrouping).toHaveLength(1);
        expect(resultWithGrouping[0]?.title).toBe("Example - New Visit");
        expect(resultWithGrouping[0]?.lastVisitTime).toBe(
          new Date(2024, 0, 15, 12, 0, 0).getTime(),
        );
      });

      it("should group results by title when groupByTitle is true", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://example.com/page1",
            title: "Same Title",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "2",
            url: "https://example.com/page2",
            title: "Same Title",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "3",
            url: "https://example.com/page3",
            title: "Different Title",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
            domain: "example.com",
          },
        ];
        await insertHistories(...historyItems);

        const resultWithoutGrouping = await searchHistories(
          bookmarkHistoryStore,
          "example",
        );
        expect(resultWithoutGrouping).toHaveLength(3);

        const resultWithGrouping = await searchHistories(
          bookmarkHistoryStore,
          "example",
          { groupByTitle: true },
        );
        expect(resultWithGrouping).toHaveLength(2);
        const sameTitleItem = resultWithGrouping.find(
          (r) => r.title === "Same Title",
        );
        expect(sameTitleItem?.url).toBe("https://example.com/page2");
      });

      it("should apply both groupByUrl and groupByTitle when both are true", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://example.com",
            title: "Title A",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "2",
            url: "https://example.com",
            title: "Title A",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "3",
            url: "https://other.com",
            title: "Title A",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
            domain: "other.com",
          },
          {
            id: "4",
            url: "https://another.com",
            title: "Title B",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 9, 0, 0).getTime(),
            domain: "another.com",
          },
        ];
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "title", {
          groupByUrl: true,
          groupByTitle: true,
        });

        expect(result).toHaveLength(2);
        expect(result.map((r) => r.url)).toContain("https://example.com");
        expect(result.map((r) => r.url)).toContain("https://another.com");
      });

      it("should return results sorted by lastVisitTime descending after grouping", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://oldest.com",
            title: "Oldest",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 9, 0, 0).getTime(),
            domain: "oldest.com",
          },
          {
            id: "2",
            url: "https://oldest.com",
            title: "Oldest Updated",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "oldest.com",
          },
          {
            id: "3",
            url: "https://newest.com",
            title: "Newest",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
            domain: "newest.com",
          },
        ];
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "com", {
          groupByUrl: true,
        });

        expect(result).toHaveLength(2);
        expect(result[0]?.url).toBe("https://newest.com");
        expect(result[1]?.url).toBe("https://oldest.com");
        expect(result[1]?.title).toBe("Oldest Updated");
      });

      it("should not group when options are false or undefined", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://example.com",
            title: "Example 1",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "2",
            url: "https://example.com",
            title: "Example 2",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
            domain: "example.com",
          },
        ];
        await insertHistories(...historyItems);

        const resultNoOptions = await searchHistories(
          bookmarkHistoryStore,
          "example",
        );
        expect(resultNoOptions).toHaveLength(2);

        const resultExplicitFalse = await searchHistories(
          bookmarkHistoryStore,
          "example",
          { groupByUrl: false, groupByTitle: false },
        );
        expect(resultExplicitFalse).toHaveLength(2);
      });

      it("should handle empty title when groupByTitle is true", async () => {
        const historyItems: HistoryItem[] = [
          {
            id: "1",
            url: "https://example.com/page1",
            title: "",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 10, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "2",
            url: "https://example.com/page2",
            title: "",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(),
            domain: "example.com",
          },
          {
            id: "3",
            url: "https://example.com/page3",
            title: "Has Title",
            visitCount: 1,
            lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(),
            domain: "example.com",
          },
        ];
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "example", {
          groupByTitle: true,
        });

        expect(result).toHaveLength(2);
        const emptyTitleItem = result.find((r) => r.title === "");
        expect(emptyTitleItem?.url).toBe("https://example.com/page2");
      });
    });

    describe("result limit", () => {
      it("should cap results at limit and keep the most recent", async () => {
        const limit = 5;
        const overCap = limit + 3;
        const baseTime = new Date(2024, 0, 1, 0, 0, 0).getTime();
        const historyItems: HistoryItem[] = Array.from(
          { length: overCap },
          (_, i) => ({
            id: `cap-${i}`,
            url: `https://example.com/page${i}`,
            title: `Truncate Test ${i}`,
            visitCount: 1,
            lastVisitTime: baseTime + i * 60 * 60 * 1000,
            domain: "example.com",
          }),
        );
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "truncate", {
          limit,
        });

        expect(result).toHaveLength(limit);

        const lastVisitTimes = result.map((r) => r.lastVisitTime);
        const sorted = [...lastVisitTimes].sort((a, b) => b - a);
        expect(lastVisitTimes).toEqual(sorted);

        const titles = new Set(result.map((r) => r.title));
        expect(titles.has(`Truncate Test 0`)).toBe(false);
        expect(titles.has(`Truncate Test ${overCap - 1}`)).toBe(true);
      });

      it("should return all results when count is below the limit", async () => {
        const baseTime = new Date(2024, 0, 1, 0, 0, 0).getTime();
        const historyItems: HistoryItem[] = Array.from(
          { length: 3 },
          (_, i) => ({
            id: `under-${i}`,
            url: `https://example.com/under${i}`,
            title: `Under Cap ${i}`,
            visitCount: 1,
            lastVisitTime: baseTime + i * 60 * 60 * 1000,
            domain: "example.com",
          }),
        );
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "under", {
          limit: 10,
        });

        expect(result).toHaveLength(3);
      });

      it("should not cap results when limit is not specified", async () => {
        const baseTime = new Date(2024, 0, 1, 0, 0, 0).getTime();
        const historyItems: HistoryItem[] = Array.from(
          { length: 20 },
          (_, i) => ({
            id: `nolimit-${i}`,
            url: `https://example.com/nolimit${i}`,
            title: `NoLimit Test ${i}`,
            visitCount: 1,
            lastVisitTime: baseTime + i * 60 * 60 * 1000,
            domain: "example.com",
          }),
        );
        await insertHistories(...historyItems);

        const result = await searchHistories(bookmarkHistoryStore, "nolimit");

        expect(result).toHaveLength(20);
      });
    });
  });

  describe("getRecent", () => {
    beforeEach(async () => {
      await bookmarkHistoryStore.initialize();
    });

    it("should get recent histories for default 3 days", async () => {
      const today = new Date(2024, 0, 15, 23, 46, 40).getTime();
      const yesterday = today - 24 * 60 * 60 * 1000;
      const olderDay = today - 5 * 24 * 60 * 60 * 1000;

      await insertHistories(
        {
          id: "1",
          url: "https://today.com",
          title: "Today Site",
          visitCount: 1,
          lastVisitTime: today,
          domain: "today.com",
        },
        {
          id: "2",
          url: "https://yesterday.com",
          title: "Yesterday Site",
          visitCount: 1,
          lastVisitTime: yesterday,
          domain: "yesterday.com",
        },
        {
          id: "2",
          url: "https://older-day.com",
          title: "Older Site",
          visitCount: 1,
          lastVisitTime: olderDay,
          domain: "olderday.com",
        },
      );

      const result = await getRecentHistories();

      expect(result).toHaveLength(2);
      expect(result[0]?.lastVisitTime).toBeGreaterThan(
        result[1]?.lastVisitTime ?? 0,
      );

      const todayItem = result.find((i) => i.url === "https://today.com");
      const yesterdayItem = result.find(
        (i) => i.url === "https://yesterday.com",
      );

      expect(todayItem).toBeDefined();
      expect(yesterdayItem).toBeDefined();
    });

    it("should get recent histories for specified number of days", async () => {
      const today = new Date(2024, 0, 15, 23, 46, 40).getTime();

      await insertHistories({
        id: "1",
        url: "https://recent.com",
        title: "Recent Site",
        visitCount: 1,
        lastVisitTime: today,
        domain: "recent.com",
      });

      const result = await getRecentHistories(7);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        url: "https://recent.com",
        title: "Recent Site",
      });
    });

    it("should sort results by lastVisitTime descending", async () => {
      const baseTime = new Date(2024, 0, 15, 23, 46, 40).getTime();

      const newest = baseTime;
      const middle = baseTime - 60 * 60 * 1000;
      const oldest = baseTime - 2 * 60 * 60 * 1000;

      await insertHistories(
        {
          id: "1",
          url: "https://middle.com",
          title: "Middle Site",
          visitCount: 1,
          lastVisitTime: middle,
          domain: "middle.com",
        },
        {
          id: "2",
          url: "https://newest.com",
          title: "Newest Site",
          visitCount: 1,
          lastVisitTime: newest,
          domain: "newest.com",
        },
        {
          id: "3",
          url: "https://oldest.com",
          title: "Oldest Site",
          visitCount: 1,
          lastVisitTime: oldest,
          domain: "oldest.com",
        },
      );

      const result = await getRecentHistories();

      expect(result).toHaveLength(3);

      expect(result[0]?.url).toBe("https://newest.com");
      expect(result[1]?.url).toBe("https://middle.com");
      expect(result[2]?.url).toBe("https://oldest.com");

      expect(result[0]?.lastVisitTime).toBeGreaterThan(
        result[1]?.lastVisitTime ?? 0,
      );
      expect(result[1]?.lastVisitTime).toBeGreaterThan(
        result[2]?.lastVisitTime ?? 0,
      );
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      resetStorageForTesting();
      await bookmarkHistoryStore.initialize();
    });

    it("removes the bookmark under root and mirrors deletion to chrome.history", async () => {
      const item: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Example",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "example.com",
      };
      await insertHistories(item);

      const beforeCount = mockBookmarkUtils.getAllMockBookmarks().length;
      const target = mockBookmarkUtils
        .getAllMockBookmarks()
        .find((b) => b.url === item.url);
      expect(target).toBeDefined();

      await bookmarkHistoryStore.delete(item);

      const afterBookmarks = mockBookmarkUtils.getAllMockBookmarks();
      expect(afterBookmarks).toHaveLength(beforeCount - 1);
      expect(afterBookmarks.find((b) => b.url === item.url)).toBeUndefined();

      expect(mockChromeHistory.deleteUrl).toHaveBeenCalledTimes(1);
      expect(mockChromeHistory.deleteUrl).toHaveBeenCalledWith({
        url: item.url,
      });
    });

    it("does not touch bookmarks outside the root folder, but still calls chrome.history.deleteUrl", async () => {
      // ルート配下に同じ URL の履歴を入れる
      const item: HistoryItem = {
        id: "1",
        url: "https://shared.com",
        title: "Inside",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "shared.com",
      };
      await insertHistories(item);

      // ユーザーが手で作った同じ URL のブックマーク (ルート外) を追加
      const outsideBookmark = mockBookmarkUtils.addMockBookmark({
        id: "outside-bookmark",
        title: "User's own bookmark",
        url: "https://shared.com",
        parentId: "user-folder",
      });

      await bookmarkHistoryStore.delete(item);

      const remaining = mockBookmarkUtils.getAllMockBookmarks();
      // 外部のブックマークは残っている
      expect(remaining.find((b) => b.id === outsideBookmark.id)).toBeDefined();
      // 自前ストア配下のブックマークは消えている
      expect(
        remaining.find(
          (b) => b.url === item.url && b.id !== outsideBookmark.id,
        ),
      ).toBeUndefined();

      // chrome.history は無条件に呼ばれる (削除は URL 単位)
      expect(mockChromeHistory.deleteUrl).toHaveBeenCalledWith({
        url: item.url,
      });
    });

    it("throws when storage is not initialized", async () => {
      resetStorageForTesting();

      const item: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Example",
        visitCount: 1,
        lastVisitTime: Date.now(),
        domain: "example.com",
      };

      await expect(bookmarkHistoryStore.delete(item)).rejects.toThrow(
        "Storage not initialized",
      );
      expect(mockChromeHistory.deleteUrl).not.toHaveBeenCalled();
    });
  });

  describe("legacy bookmark recovery (no metadata)", () => {
    beforeEach(async () => {
      resetStorageForTesting();
      await bookmarkHistoryStore.initialize();
    });

    it("reconstructs lastVisitTime from YYYY/MM/DD/HH folder path when metadata is absent", async () => {
      // 旧バージョンで保存されたかのようにメタデータなしのブックマークを直に配置する
      const root = mockBookmarkUtils
        .getAllMockBookmarks()
        .find((b) => b.title === ROOT_FOLDER_NAME);
      expect(root).toBeDefined();

      const year = mockBookmarkUtils.addMockBookmark({
        title: "2024",
        parentId: root!.id,
      });
      const month = mockBookmarkUtils.addMockBookmark({
        title: "01",
        parentId: year.id,
      });
      const day = mockBookmarkUtils.addMockBookmark({
        title: "15",
        parentId: month.id,
      });
      const hour = mockBookmarkUtils.addMockBookmark({
        title: "10",
        parentId: day.id,
      });
      mockBookmarkUtils.addMockBookmark({
        title: "Legacy Site", // 💾 区切り文字なし = レガシー
        url: "https://legacy.example.com",
        parentId: hour.id,
      });

      const result = await searchHistories(bookmarkHistoryStore, "legacy");

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Legacy Site");
      // フォルダパスから 2024-01-15 10:00 を復元できていること
      expect(result[0]?.lastVisitTime).toBe(
        new Date(2024, 0, 15, 10, 0, 0).getTime(),
      );
    });
  });
});
