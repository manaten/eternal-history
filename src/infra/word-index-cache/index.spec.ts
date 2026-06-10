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

  it("save → load で index が復元される", async () => {
    const index = buildWordIndex(["GitHub GitHub", "GitLab"]);
    await saveWordIndexCache(index);

    const loaded = await loadWordIndexCache();

    expect(loaded).not.toBeNull();
    expect(loaded!.wordCounts).toEqual(index.wordCounts);
    expect(lookupSuggestions(loaded!, "git", 10)).toEqual(
      lookupSuggestions(index, "git", 10),
    );
  });

  it("壊れたキャッシュは null を返す (フル再構築フォールバック)", async () => {
    mockStorageUtils.setItem("wordIndexCache", { v: 999, words: "broken" });
    expect(await loadWordIndexCache()).toBeNull();
  });

  it("save は丸ごと置き換える", async () => {
    await saveWordIndexCache(buildWordIndex(["OldWord OldWord"]));
    await saveWordIndexCache(buildWordIndex(["NewWord"]));

    const loaded = await loadWordIndexCache();
    expect(loaded!.wordCounts.has("OldWord")).toBe(false);
    expect(loaded!.wordCounts.get("NewWord")).toBe(1);
  });
});
