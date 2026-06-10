import { describe, it, expect, beforeEach } from "vitest";

import { loadWordIndexCache, saveWordIndexCache } from "./index";
import {
  resetChromeStorageMock,
  setupChromeStorageMock,
  mockStorageUtils,
} from "../../domain/__mocks__/chrome_storage.mock";
import { buildWordIndex, lookupSuggestions } from "../../domain/word-index";

setupChromeStorageMock();

describe("word-index-cache", () => {
  beforeEach(() => {
    resetChromeStorageMock();
  });

  it("未保存なら null を返す", async () => {
    expect(await loadWordIndexCache()).toBeNull();
  });

  it("save → load で index と builtAt が復元される", async () => {
    const index = buildWordIndex(["GitHub GitHub", "GitLab"]);
    await saveWordIndexCache(index, 12345);

    const loaded = await loadWordIndexCache();

    expect(loaded).not.toBeNull();
    expect(loaded!.builtAt).toBe(12345);
    expect(loaded!.index.wordCounts).toEqual(index.wordCounts);
    expect(lookupSuggestions(loaded!.index, "git", 10)).toEqual(
      lookupSuggestions(index, "git", 10),
    );
  });

  it("壊れたキャッシュは null を返す (フル再構築フォールバック)", async () => {
    mockStorageUtils.setItem("wordIndexCache", { v: 999, words: "broken" });
    expect(await loadWordIndexCache()).toBeNull();
  });

  it("save は丸ごと置き換える", async () => {
    await saveWordIndexCache(buildWordIndex(["OldWord OldWord"]), 1);
    await saveWordIndexCache(buildWordIndex(["NewWord"]), 2);

    const loaded = await loadWordIndexCache();
    expect(loaded!.index.wordCounts.has("OldWord")).toBe(false);
    expect(loaded!.index.wordCounts.get("NewWord")).toBe(1);
    expect(loaded!.builtAt).toBe(2);
  });
});
