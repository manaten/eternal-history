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
  setupChromeBookmarksMock,
  resetChromeBookmarksMock,
  mockBookmarkUtils,
} from "./__mocks__/chrome_bookmarks.mock";
import {
  initializeStorage,
  insertHistories,
  search,
  getRecentHistories,
  ROOT_FOLDER_NAME,
  resetStorageForTesting,
} from "./storage";
import { HistoryItem } from "../types/HistoryItem";

describe("storage", () => {
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

  describe("initializeStorage", () => {
    it("should create root folder when it doesn't exist", async () => {
      expect(mockBookmarkUtils.getAllMockBookmarks()).toEqual([]);
      await initializeStorage();
      expect(mockBookmarkUtils.getAllMockBookmarks()).toEqual([
        expect.objectContaining({
          title: ROOT_FOLDER_NAME,
          id: expect.any(String),
          parentId: undefined,
        }),
      ]);
    });

    it("should use existing root folder when it exists", async () => {
      // Setup existing root folder
      mockBookmarkUtils.addMockBookmark({
        id: "existing-root",
        title: ROOT_FOLDER_NAME,
      });

      const bookmarksBeforeInit = mockBookmarkUtils.getAllMockBookmarks();
      await initializeStorage();
      const bookmarksAfterInit = mockBookmarkUtils.getAllMockBookmarks();

      // Should not create new bookmarks, existing root folder should be used
      expect(bookmarksAfterInit).toEqual(bookmarksBeforeInit);
      expect(bookmarksAfterInit).toHaveLength(1);
      expect(bookmarksAfterInit[0]).toMatchObject({
        id: "existing-root",
        title: ROOT_FOLDER_NAME,
      });
    });
  });

  describe("insertHistories", () => {
    beforeEach(async () => {
      resetStorageForTesting();
      await initializeStorage();
    });

    it("should throw error when storage is not initialized", async () => {
      // Reset storage state without initializing
      resetStorageForTesting();

      const historyItem: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Example",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00
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
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00
        domain: "example.com",
      };

      await insertHistories(historyItem);

      const bookmarks = mockBookmarkUtils.getAllMockBookmarks();

      // Should have: root folder + year + month + day + hour + bookmark = 6 items
      expect(bookmarks).toHaveLength(6);

      // Check root folder exists
      const rootFolder = bookmarks.find((b) => b.title === ROOT_FOLDER_NAME);
      expect(rootFolder).toBeDefined();

      // Check year folder (2024)
      const yearFolder = bookmarks.find(
        (b) => b.title === "2024" && b.parentId === rootFolder?.id,
      );
      expect(yearFolder).toBeDefined();

      // Check month folder (01)
      const monthFolder = bookmarks.find(
        (b) => b.title === "01" && b.parentId === yearFolder?.id,
      );
      expect(monthFolder).toBeDefined();

      // Check day folder (15)
      const dayFolder = bookmarks.find(
        (b) => b.title === "15" && b.parentId === monthFolder?.id,
      );
      expect(dayFolder).toBeDefined();

      // Check hour folder - should be UTC time now
      const hourFolder = bookmarks.find(
        (b) => b.title === "10" && b.parentId === dayFolder?.id, // UTC time
      );
      expect(hourFolder).toBeDefined();

      // Check bookmark
      const bookmark = bookmarks.find(
        (b) => b.url === "https://example.com" && b.parentId === hourFolder?.id,
      );
      expect(bookmark).toBeDefined();
      expect(bookmark?.url).toBe("https://example.com");
      // Title should have exact metadata format
      expect(bookmark?.title).toBe(
        'Example Site 💾{"v":1,"t":' +
          new Date(2024, 0, 15, 10, 30, 0).getTime() +
          ',"vc":1}',
      );
    });

    it("should update existing bookmark title when URL matches", async () => {
      // First, create a bookmark with the same URL but different title
      const initialItem: HistoryItem = {
        id: "1",
        url: "https://example.com",
        title: "Old Title",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00
        domain: "example.com",
      };

      await insertHistories(initialItem);
      const bookmarksAfterFirst = mockBookmarkUtils.getAllMockBookmarks();
      const initialBookmarkCount = bookmarksAfterFirst.length;

      // Now insert the same URL with a different title
      const updatedItem: HistoryItem = {
        id: "2",
        url: "https://example.com",
        title: "Updated Title",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00
        domain: "example.com",
      };

      await insertHistories(updatedItem);
      const bookmarksAfterUpdate = mockBookmarkUtils.getAllMockBookmarks();

      // Should not create new bookmarks, just update the existing one
      expect(bookmarksAfterUpdate).toHaveLength(initialBookmarkCount);

      // Check that the bookmark title was updated (should contain the new title)
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
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00 UTC
          domain: "site1.com",
        },
        {
          id: "2",
          url: "https://site2.com",
          title: "Site 2",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 15, 0).getTime(), // 2024-01-15 11:15:00 UTC
          domain: "site2.com",
        },
      ];

      await insertHistories(...historyItems);

      const bookmarks = mockBookmarkUtils.getAllMockBookmarks();
      expect(bookmarks).toHaveLength(8); // 2 bookmarks + year + month + day + 2 hours + root

      // Check that both bookmarks were created with exact metadata format
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

      // Should have appropriate folder hierarchy for both items
      // Both items are on same day but different hours, so they should share some folders
      expect(bookmarks.find((b) => b.title === "2024")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "01")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "15")).toBeDefined();
      expect(bookmarks.find((b) => b.title === "10")).toBeDefined(); // First item: 10:30 UTC
      expect(bookmarks.find((b) => b.title === "11")).toBeDefined(); // Second item: 11:15 UTC
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

      // Should have correct metadata format
      expect(testBookmark?.title).toBe(
        'Test Site Title 💾{"v":1,"t":' +
          new Date(2009, 1, 13, 23, 31, 30, 123).getTime() +
          ',"vc":3}',
      );
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should return empty array when storage is not initialized", async () => {
      const result = await search("test");
      expect(result).toEqual([]);
    });

    it("should return empty array for empty query", async () => {
      const result = await search("   ");
      expect(result).toEqual([]);
    });

    it("should search bookmarks by single term", async () => {
      // Create some test bookmarks
      const historyItems: HistoryItem[] = [
        {
          id: "1",
          url: "https://google.com",
          title: "Google Search",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(), // 2024-01-15 10:30:00 UTC
          domain: "google.com",
        },
        {
          id: "2",
          url: "https://google.com/maps",
          title: "Google Maps",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 11, 0, 0).getTime(), // 2024-01-15 11:00:00 UTC
          domain: "google.com",
        },
        {
          id: "3",
          url: "https://yahoo.com",
          title: "Yahoo Search Engine",
          visitCount: 1,
          lastVisitTime: new Date(2024, 0, 15, 12, 0, 0).getTime(), // 2024-01-15 12:00:00 UTC
          domain: "yahoo.com",
        },
      ];
      await insertHistories(...historyItems);

      const result = await search("google");
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
      // Create test bookmarks
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

      const result = await search("google search");
      // Should only return the Google Search Engine, not Google Maps or Yahoo
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        url: "https://google.com",
        title: "Google Search Engine",
      });
    });

    it("should only return bookmarks under root folder", async () => {
      // Add a bookmark inside the root folder structure
      await insertHistories({
        id: "1",
        url: "https://inside.com",
        title: "Inside Bookmark",
        visitCount: 1,
        lastVisitTime: new Date(2024, 0, 15, 10, 30, 0).getTime(),
        domain: "inside.com",
      });

      // Add a bookmark outside of root folder structure
      mockBookmarkUtils.addMockBookmark({
        id: "outside",
        title: "Outside Bookmark",
        url: "https://outside.com",
        parentId: "other-parent",
      });

      const resultInside = await search("inside");
      const resultOutside = await search("outside");

      // Should find the bookmark under root folder
      expect(resultInside).toHaveLength(1);
      expect(resultInside[0]).toMatchObject({
        url: "https://inside.com",
        title: "Inside Bookmark",
      });

      // Should not find the bookmark outside root folder
      expect(resultOutside).toEqual([]);
    });

    it("should search by site: syntax for domain matching", async () => {
      // Create test bookmarks with different domains
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

      // Test exact domain search
      const googleResult = await search("site:google.com");
      expect(googleResult).toHaveLength(2);
      expect(googleResult.map((r) => r.url)).toContain(
        "https://google.com/search",
      );
      expect(googleResult.map((r) => r.url)).toContain(
        "https://maps.google.com",
      );

      // Test partial domain search
      const yahoResult = await search("site:yahoo");
      expect(yahoResult).toHaveLength(1);
      expect(yahoResult[0]?.url).toBe("https://yahoo.com");
    });

    it("should combine site: search with regular search terms", async () => {
      // Create test bookmarks
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

      // Search for "search" within google.com domain
      const result = await search("site:google.com search");
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

      // Multiple site: terms should match domains containing both terms
      const result = await search("site:search site:yahoo");
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

      const result = await search("site:nonexistent.com");
      expect(result).toEqual([]);
    });

    it("should handle invalid URLs gracefully in site: search", async () => {
      // Add a bookmark with an invalid URL (this shouldn't normally happen, but test defensive coding)
      const mockBookmark = {
        id: "invalid",
        title: "Invalid URL Bookmark",
        url: "not-a-valid-url",
        parentId: "some-parent",
      };
      mockBookmarkUtils.addMockBookmark(mockBookmark);

      // This should not throw an error and should simply not match
      const result = await search("site:example.com");
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

      // Search for google but exclude ads
      const result = await search("google -ads");
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

      // Exclude both ads and spam
      const result = await search("example -ads -spam");
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

      const result = await search("-ads -spam");
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

      const result = await search("site:google.com -ads");
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe("https://google.com/search");
    });
  });

  describe("getRecentHistories", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should return empty array when storage is not initialized", async () => {
      const result = await getRecentHistories();
      expect(result).toEqual([]);
    });

    it("should get recent histories for default 3 days", async () => {
      // Use fixed timestamps for predictable testing
      const today = new Date(2024, 0, 15, 23, 46, 40).getTime(); // 2024-01-15 23:46:40 UTC
      const yesterday = today - 24 * 60 * 60 * 1000; // 1 day ago
      const olderDay = today - 5 * 24 * 60 * 60 * 1000; // 5 days ago

      // Add bookmarks for today and yesterday
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

      // Should return both bookmarks
      expect(result).toHaveLength(2);

      // Should be sorted by lastVisitTime descending (newest first)
      expect(result[0]?.lastVisitTime).toBeGreaterThan(
        result[1]?.lastVisitTime ?? 0,
      );

      // Check the actual items
      const todayItem = result.find((i) => i.url === "https://today.com");
      const yesterdayItem = result.find(
        (i) => i.url === "https://yesterday.com",
      );

      expect(todayItem).toBeDefined();
      expect(yesterdayItem).toBeDefined();
    });

    it("should get recent histories for specified number of days", async () => {
      const today = new Date(2024, 0, 15, 23, 46, 40).getTime(); // Fixed timestamp

      // Add a bookmark for today
      await insertHistories({
        id: "1",
        url: "https://recent.com",
        title: "Recent Site",
        visitCount: 1,
        lastVisitTime: today,
        domain: "recent.com",
      });

      const result = await getRecentHistories(7);

      // Should find the bookmark within 7 days
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        url: "https://recent.com",
        title: "Recent Site",
      });
    });

    it("should sort results by lastVisitTime descending", async () => {
      // Use fixed timestamps for predictable testing
      const baseTime = new Date(2024, 0, 15, 23, 46, 40).getTime(); // Fixed timestamp

      // Use specific times that will result in different hour folders on the same day
      const newest = baseTime;
      const middle = baseTime - 60 * 60 * 1000; // 1 hour ago
      const oldest = baseTime - 2 * 60 * 60 * 1000; // 2 hours ago

      // Add bookmarks in different order than expected result
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

      // Should be sorted by lastVisitTime descending (newest first)
      expect(result[0]?.url).toBe("https://newest.com");
      expect(result[1]?.url).toBe("https://middle.com");
      expect(result[2]?.url).toBe("https://oldest.com");

      // Verify timestamps are in descending order
      expect(result[0]?.lastVisitTime).toBeGreaterThan(
        result[1]?.lastVisitTime ?? 0,
      );
      expect(result[1]?.lastVisitTime).toBeGreaterThan(
        result[2]?.lastVisitTime ?? 0,
      );
    });
  });
});
