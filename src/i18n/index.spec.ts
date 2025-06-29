import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock navigator.language for testing
beforeEach(() => {
  // eslint-disable-next-line functional/immutable-data
  Object.defineProperty(global.navigator, "language", {
    value: "en-US",
    configurable: true,
  });
});

afterEach(() => {
  vi.resetModules();
});

describe("i18n", () => {
  describe("basic translation functionality", () => {
    it("should return English text for English locale", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      // Re-import to get fresh module with new navigator.language
      const { t } = await import("./index");

      expect(t("searchBox.placeholder")).toBe("Search history...");
      expect(t("historyItem.deleteItem")).toBe("Delete item");
      expect(t("helpModal.howToUse")).toBe("How to use");
    });

    it("should return Japanese text for Japanese locale", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "ja-JP",
        configurable: true,
      });

      // Re-import to get fresh module with new navigator.language
      const { t } = await import("./index");

      expect(t("searchBox.placeholder")).toBe("履歴を検索...");
      expect(t("historyItem.deleteItem")).toBe("履歴を削除");
      expect(t("helpModal.howToUse")).toBe("使い方");
    });

    it("should handle different Japanese locale variations", async () => {
      const locales = ["ja", "ja-JP", "ja-JP-u-ca-japanese"];

      for (const locale of locales) {
        // eslint-disable-next-line functional/immutable-data
        Object.defineProperty(global.navigator, "language", {
          value: locale,
          configurable: true,
        });

        const { t } = await import("./index");

        expect(t("searchBox.placeholder")).toBe("履歴を検索...");
        vi.resetModules();
      }
    });
  });

  describe("parameter replacement functionality", () => {
    it("should replace single parameter in English", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("app.confirmDeleteHistoryItem", { title: "Test Page" });
      expect(result).toBe('Are you sure you want to delete "Test Page"?');
    });

    it("should replace single parameter in Japanese", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "ja-JP",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("app.confirmDeleteHistoryItem", {
        title: "テストページ",
      });
      expect(result).toBe(
        "「テストページ」を履歴から削除してもよろしいですか？",
      );
    });

    it("should handle empty replacement object", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("searchBox.placeholder", {});
      expect(result).toBe("Search history...");
    });

    it("should handle undefined replacement parameter", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("searchBox.placeholder");
      expect(result).toBe("Search history...");
    });

    it("should handle special characters in replacement values", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("app.confirmDeleteHistoryItem", {
        title: 'Test with "quotes" and {braces}',
      });
      expect(result).toBe(
        'Are you sure you want to delete "Test with "quotes" and {braces}"?',
      );
    });

    it("should handle HTML entities and special Unicode characters", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "ja-JP",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("app.confirmDeleteHistoryItem", {
        title: "日本語テスト & エンティティ <script>",
      });
      expect(result).toBe(
        "「日本語テスト & エンティティ <script>」を履歴から削除してもよろしいですか？",
      );
    });

    it("should handle missing placeholder in replacement object", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      // Call with a key that has placeholders but don't provide replacement
      const result = t("app.confirmDeleteHistoryItem");
      expect(result).toBe('Are you sure you want to delete "{title}"?');
    });

    it("should handle extra replacement parameters that don't match any placeholder", async () => {
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(global.navigator, "language", {
        value: "en-US",
        configurable: true,
      });

      const { t } = await import("./index");

      const result = t("searchBox.placeholder", {
        title: "unused",
        extraParam: "also unused",
      });
      expect(result).toBe("Search history...");
    });
  });
});
