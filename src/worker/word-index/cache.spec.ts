import { describe, it, expect, beforeEach } from "vitest";

import { loadWordIndexCache, saveWordIndexCache } from "./cache";
import {
  resetChromeStorageMock,
  setupChromeStorageMock,
  mockStorageUtils,
} from "../../common/chrome/__mocks__/chrome_storage.mock";
import { buildWordIndex, lookupSuggestions } from "../../common/word-index";

setupChromeStorageMock();

const STORAGE_KEY = "wordIndexCache";

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
    expect(loaded!.index.prefixIndex).toEqual(index.prefixIndex);
    expect(lookupSuggestions(loaded!.index, "git", 10)).toEqual(
      lookupSuggestions(index, "git", 10),
    );
  });

  it("空 index も roundtrip できる", async () => {
    await saveWordIndexCache(buildWordIndex([]), 0);
    const loaded = await loadWordIndexCache();
    expect(loaded).not.toBeNull();
    expect(loaded!.index.wordCounts.size).toBe(0);
  });

  it("save は丸ごと置き換える", async () => {
    await saveWordIndexCache(buildWordIndex(["OldWord OldWord"]), 1);
    await saveWordIndexCache(buildWordIndex(["NewWord"]), 2);

    const loaded = await loadWordIndexCache();
    expect(loaded!.index.wordCounts.has("OldWord")).toBe(false);
    expect(loaded!.index.wordCounts.get("NewWord")).toBe(1);
    expect(loaded!.builtAt).toBe(2);
  });

  describe("壊れた / 非互換キャッシュは null を返す (フル再構築フォールバック)", () => {
    const cases: { label: string; raw: unknown }[] = [
      { label: "バージョン不一致", raw: { v: 999, builtAt: 1, words: [] } },
      { label: "builtAt 欠落", raw: { v: 1, words: [] } },
      { label: "builtAt が数値でない", raw: { v: 1, builtAt: "x", words: [] } },
      { label: "builtAt が NaN", raw: { v: 1, builtAt: NaN, words: [] } },
      {
        label: "words が配列でない",
        raw: { v: 1, builtAt: 1, words: "broken" },
      },
      {
        label: "count が数値でない",
        raw: { v: 1, builtAt: 1, words: [["GitHub", "3"]] },
      },
      {
        label: "count が NaN",
        raw: { v: 1, builtAt: 1, words: [["GitHub", NaN]] },
      },
      {
        label: "count が Infinity",
        raw: { v: 1, builtAt: 1, words: [["GitHub", Infinity]] },
      },
      { label: "要素が null", raw: { v: 1, builtAt: 1, words: [null] } },
      { label: "要素が数値", raw: { v: 1, builtAt: 1, words: [42] } },
      { label: "要素が文字列", raw: { v: 1, builtAt: 1, words: ["GitHub"] } },
    ];

    cases.forEach(({ label, raw }) => {
      it(`${label} → null (throw しない)`, async () => {
        mockStorageUtils.setItem(STORAGE_KEY, raw);
        expect(await loadWordIndexCache()).toBeNull();
      });
    });
  });

  it("同じ単語が複数回現れる破損データは許容し、整合した index に畳む", async () => {
    // 後勝ちの上書き + prefixIndex の重複なしを確認 (どのみち保存元が壊れている
    // ので、null にせず graceful に復元できれば十分という方針)。
    mockStorageUtils.setItem(STORAGE_KEY, {
      v: 1,
      builtAt: 1,
      words: [
        ["GitHub", 1],
        ["GITHUB", 2],
        ["GitHub", 5],
      ],
    });

    const loaded = await loadWordIndexCache();

    expect(loaded).not.toBeNull();
    expect(loaded!.index.wordCounts.get("GitHub")).toBe(5); // 後勝ち
    const prefixTotal = [...loaded!.index.prefixIndex.values()].reduce(
      (n, list) => n + list.length,
      0,
    );
    expect(prefixTotal).toBe(loaded!.index.wordCounts.size);
  });
});
