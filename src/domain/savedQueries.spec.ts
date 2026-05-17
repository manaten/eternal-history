import { beforeEach, describe, expect, it } from "vitest";

import {
  mockStorageUtils,
  resetChromeStorageMock,
  setupChromeStorageMock,
} from "./__mocks__/chrome_storage.mock";
import {
  addSavedQuery,
  getSavedQueries,
  removeSavedQuery,
  SavedQuery,
} from "./savedQueries";

describe("savedQueries", () => {
  beforeEach(() => {
    setupChromeStorageMock();
    resetChromeStorageMock();
  });

  describe("getSavedQueries", () => {
    it("should return empty array when no queries are saved", async () => {
      const queries = await getSavedQueries();
      expect(queries).toEqual([]);
    });

    it("should return saved queries from storage", async () => {
      const mockQueries: SavedQuery[] = [
        { id: "1", query: "react", createdAt: 1000 },
        { id: "2", query: "typescript", createdAt: 2000 },
      ];

      mockStorageUtils.setItem("eternal-history-saved-queries", mockQueries);

      const queries = await getSavedQueries();
      expect(queries).toEqual(mockQueries);
    });
  });

  describe("addSavedQuery", () => {
    it("should add a new query to empty storage", async () => {
      await addSavedQuery("react");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({
        query: "react",
      });
      expect(queries[0]?.id).toBeDefined();
      expect(queries[0]?.createdAt).toBeDefined();
    });

    it("should add a new query to existing queries", async () => {
      const existingQueries: SavedQuery[] = [
        { id: "1", query: "react", createdAt: 1000 },
      ];
      mockStorageUtils.setItem(
        "eternal-history-saved-queries",
        existingQueries,
      );

      await addSavedQuery("typescript");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(2);
      expect(queries.find((q) => q.query === "typescript")).toBeDefined();
      expect(queries.find((q) => q.query === "react")).toBeDefined();
    });

    it("should not add duplicate queries", async () => {
      const existingQueries: SavedQuery[] = [
        { id: "1", query: "react", createdAt: 1000 },
      ];
      mockStorageUtils.setItem(
        "eternal-history-saved-queries",
        existingQueries,
      );

      await addSavedQuery("react");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(1);
      expect(queries[0]?.query).toBe("react");
    });

    it("should generate unique IDs for new queries", async () => {
      await addSavedQuery("react");
      await addSavedQuery("typescript");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(2);
      expect(queries[0]?.id).not.toBe(queries[1]?.id);
    });
  });

  describe("removeSavedQuery", () => {
    it("should remove a query by ID", async () => {
      const existingQueries: SavedQuery[] = [
        { id: "1", query: "react", createdAt: 1000 },
        { id: "2", query: "typescript", createdAt: 2000 },
      ];
      mockStorageUtils.setItem(
        "eternal-history-saved-queries",
        existingQueries,
      );

      await removeSavedQuery("1");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(1);
      expect(queries[0]?.id).toBe("2");
      expect(queries[0]?.query).toBe("typescript");
    });

    it("should handle removing non-existent query gracefully", async () => {
      const existingQueries: SavedQuery[] = [
        { id: "1", query: "react", createdAt: 1000 },
      ];
      mockStorageUtils.setItem(
        "eternal-history-saved-queries",
        existingQueries,
      );

      await removeSavedQuery("non-existent");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(1);
      expect(queries[0]?.id).toBe("1");
    });

    it("should handle empty storage when removing", async () => {
      await removeSavedQuery("1");

      const queries = await getSavedQueries();
      expect(queries).toEqual([]);
    });
  });

  describe("integration tests", () => {
    it("should handle complete workflow of adding and removing queries", async () => {
      // Start with empty storage
      expect(await getSavedQueries()).toEqual([]);

      // Add multiple queries
      await addSavedQuery("react");
      await addSavedQuery("typescript");
      await addSavedQuery("storybook");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(3);

      // Remove one query
      const reactQuery = queries.find((q) => q.query === "react");
      expect(reactQuery).toBeDefined();
      if (reactQuery) {
        await removeSavedQuery(reactQuery.id);
      }

      const updatedQueries = await getSavedQueries();
      expect(updatedQueries).toHaveLength(2);
      expect(updatedQueries.find((q) => q.query === "react")).toBeUndefined();
      expect(
        updatedQueries.find((q) => q.query === "typescript"),
      ).toBeDefined();
      expect(updatedQueries.find((q) => q.query === "storybook")).toBeDefined();
    });

    it("should maintain query order and metadata", async () => {
      const startTime = Date.now();

      await addSavedQuery("first");
      await addSavedQuery("second");

      const queries = await getSavedQueries();
      expect(queries).toHaveLength(2);

      // Check that all queries have required fields
      for (const query of queries) {
        expect(query.id).toBeDefined();
        expect(query.query).toBeDefined();
        expect(query.createdAt).toBeGreaterThanOrEqual(startTime);
      }
    });
  });
});
