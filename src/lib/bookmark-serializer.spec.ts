import { describe, it, expect } from "vitest";

import {
  serializeHistoryItemToBookmark,
  deserializeBookmarkToHistoryItem,
} from "./bookmark-serializer";
import { HistoryItem } from "../types/HistoryItem";

describe("bookmark-serializer", () => {
  describe("serializeHistoryItemToBookmark", () => {
    it("should serialize HistoryItem to bookmark format with metadata", () => {
      const historyItem: HistoryItem = {
        id: "test-id",
        url: "https://example.com",
        title: "Example Site",
        visitCount: 5,
        lastVisitTime: 1234567890123,
        domain: "example.com",
      };

      const result = serializeHistoryItemToBookmark(historyItem);

      expect(result).toEqual({
        title: 'Example Site 💾{"v":1,"t":1234567890123,"vc":5}',
        url: "https://example.com",
      });
    });

    it("should handle special characters in title", () => {
      const historyItem: HistoryItem = {
        id: "test-id",
        url: "https://example.com",
        title: 'Test & Special "Characters" - Site',
        visitCount: 1,
        lastVisitTime: 1234567890123,
        domain: "example.com",
      };

      const result = serializeHistoryItemToBookmark(historyItem);

      expect(result.title).toContain('Test & Special "Characters" - Site');
      expect(result.title).toContain('💾{"v":1,"t":1234567890123,"vc":1}');
    });
  });

  describe("deserializeBookmarkToHistoryItem", () => {
    it("should deserialize bookmark with metadata", () => {
      const bookmark = {
        id: "bookmark-id",
        title: 'Example Site 💾{"v":1,"t":1234567890123,"vc":5}',
        url: "https://example.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://example.com",
        title: "Example Site",
        lastVisitTime: 1234567890123,
        visitCount: 5,
        domain: "example.com",
      });
    });

    it("should handle bookmark without metadata (legacy format)", () => {
      const bookmark = {
        id: "bookmark-id",
        title: "Legacy Site",
        url: "https://legacy.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://legacy.com",
        title: "Legacy Site",
        lastVisitTime: 0, // No metadata, so lastVisitTime is 0
        visitCount: 1, // Default value
        domain: "legacy.com",
      });
    });

    it("should handle malformed metadata gracefully", () => {
      const bookmark = {
        id: "bookmark-id",
        title: "Site with 💾{invalid json}",
        url: "https://malformed.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://malformed.com",
        title: "Site with 💾{invalid json}", // Keeps original title when parsing fails
        lastVisitTime: 0,
        visitCount: 1,
        domain: "malformed.com",
      });
    });

    it("should handle metadata with missing fields", () => {
      const bookmark = {
        id: "bookmark-id",
        title: 'Partial Metadata 💾{"v":1,"t":1234567890123}',
        url: "https://partial.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://partial.com",
        title: "Partial Metadata",
        lastVisitTime: 1234567890123,
        visitCount: 1, // Default when not specified
        domain: "partial.com",
      });
    });

    it("should handle multiple metadata patterns in title", () => {
      const bookmark = {
        id: "bookmark-id",
        title:
          'Site with 💾 emoji and another 💾{"v":1,"t":1234567890123,"vc":3}',
        url: "https://multiple.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://multiple.com",
        title: "Site with 💾 emoji and another", // Should extract only the last metadata
        lastVisitTime: 1234567890123,
        visitCount: 3,
        domain: "multiple.com",
      });
    });

    it("should handle invalid version in metadata", () => {
      const bookmark = {
        id: "bookmark-id",
        title: 'Invalid Version 💾{"v":"not-a-number","t":1234567890123}',
        url: "https://invalid.com",
        dateAdded: 1234567890000,
        syncing: true,
      };

      const result = deserializeBookmarkToHistoryItem(bookmark);

      expect(result).toEqual({
        id: "bookmark-id",
        url: "https://invalid.com",
        title: 'Invalid Version 💾{"v":"not-a-number","t":1234567890123}', // Falls back to original
        lastVisitTime: 0,
        visitCount: 1,
        domain: "invalid.com",
      });
    });
  });
});
