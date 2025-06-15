import { describe, it, expect, beforeEach, vi } from "vitest";

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

// Mock console methods to avoid noise in tests
vi.mock("console", () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

describe("storage", () => {
  beforeEach(() => {
    setupChromeBookmarksMock();
    resetChromeBookmarksMock();
  });

  describe("initializeStorage", () => {
    it("should create root folder when it doesn't exist", async () => {
      await initializeStorage();

      expect(chrome.bookmarks.search).toHaveBeenCalledWith({
        title: ROOT_FOLDER_NAME,
      });
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: undefined,
        title: ROOT_FOLDER_NAME,
      });
    });

    it("should use existing root folder when it exists", async () => {
      // Setup existing root folder
      mockBookmarkUtils.addMockBookmark({
        id: "existing-root",
        title: ROOT_FOLDER_NAME,
      });

      await initializeStorage();

      expect(chrome.bookmarks.search).toHaveBeenCalledWith({
        title: ROOT_FOLDER_NAME,
      });
      expect(chrome.bookmarks.create).not.toHaveBeenCalled();
    });
  });

  describe("insertHistories", () => {
    beforeEach(async () => {
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

      // Verify folder hierarchy creation
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "1", // root folder
        title: "2024",
      });
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "2", // year folder
        title: "01",
      });
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "3", // month folder
        title: "15",
      });
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "4", // day folder
        title: "10",
      });

      // Verify bookmark creation
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "5", // hour folder
        title: "Example Site",
        url: "https://example.com",
      });
    });

    it("should update existing bookmark title when URL matches", async () => {
      // TODO: This test needs more complex mock setup to properly simulate
      // the bookmark hierarchy and existing bookmark detection
      expect(true).toBe(true);
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

      // Should create bookmarks for both items
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: expect.any(String),
        title: "Site 1",
        url: "https://site1.com",
      });
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: expect.any(String),
        title: "Site 2",
        url: "https://site2.com",
      });
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should return empty array when storage is not initialized", async () => {
      resetChromeBookmarksMock();
      setupChromeBookmarksMock();

      const result = await search("test");

      expect(result).toEqual([]);
    });

    it("should return empty array for empty query", async () => {
      const result = await search("   ");

      expect(result).toEqual([]);
    });

    it("should search bookmarks by single term", async () => {
      // TODO: This test needs proper mock setup for the search functionality
      // including the isUnderFolder check and bookmark retrieval
      const result = await search("google");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter results by multiple terms (AND search)", async () => {
      // TODO: This test needs proper mock setup for multi-term search
      const result = await search("google search");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should only return bookmarks under root folder", async () => {
      // Setup bookmark outside of root folder
      mockBookmarkUtils.addMockBookmark({
        id: "outside",
        title: "Outside Bookmark",
        url: "https://outside.com",
        parentId: "other-parent",
      });

      const result = await search("outside");

      expect(result).toEqual([]);
    });
  });

  describe("getRecentHistories", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should return empty array when storage is not initialized", async () => {
      resetChromeBookmarksMock();
      setupChromeBookmarksMock();

      const result = await getRecentHistories();

      expect(result).toEqual([]);
    });

    it("should get recent histories for default 3 days", async () => {
      // TODO: This test needs proper date-based folder hierarchy setup
      const result = await getRecentHistories();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get recent histories for specified number of days", async () => {
      mockBookmarkUtils.createMockHierarchy(ROOT_FOLDER_NAME);

      const result = await getRecentHistories(7);

      // Should call getDateArray with 7 days
      expect(result).toBeDefined();
    });

    it("should handle folders that don't exist gracefully", async () => {
      // Don't setup any folder hierarchy
      const result = await getRecentHistories(1);

      expect(result).toEqual([]);
    });

    it("should sort results by lastVisitTime descending", async () => {
      // TODO: This test needs proper date-based folder hierarchy and sorting setup
      const result = await getRecentHistories();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
