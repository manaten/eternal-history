import { describe, it, expect } from "vitest";

import { uniqBy } from "./array";

describe("array", () => {
  describe("uniqBy", () => {
    it("プリミティブ値の配列から重複を除去する", () => {
      const numbers = [1, 2, 3, 2, 4, 1, 5];
      const result = uniqBy(numbers, (n) => n);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("オブジェクトの配列からIDで重複を除去する", () => {
      const items = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 1, name: "Alice (duplicate)" },
        { id: 3, name: "Charlie" },
        { id: 2, name: "Bob (duplicate)" },
      ];
      const result = uniqBy(items, (item) => item.id);
      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ]);
    });

    it("最初に出現した要素を残す", () => {
      const items = [
        { id: 1, value: "first" },
        { id: 1, value: "second" },
        { id: 1, value: "third" },
      ];
      const result = uniqBy(items, (item) => item.id);
      expect(result).toEqual([{ id: 1, value: "first" }]);
    });

    it("空配列を処理する", () => {
      const result = uniqBy([], (n) => n);
      expect(result).toEqual([]);
    });

    it("すべて重複している場合、最初の要素だけを返す", () => {
      const items = [
        { id: 1, name: "A" },
        { id: 1, name: "B" },
        { id: 1, name: "C" },
      ];
      const result = uniqBy(items, (item) => item.id);
      expect(result).toEqual([{ id: 1, name: "A" }]);
    });

    it("重複がない場合、元の配列と同じ要素を返す", () => {
      const items = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ];
      const result = uniqBy(items, (item) => item.id);
      expect(result).toEqual(items);
    });

    it("複雑なキー抽出関数を使用できる", () => {
      const items = [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" },
        { firstName: "John", lastName: "Doe" },
      ];
      const result = uniqBy(
        items,
        (item) => `${item.firstName} ${item.lastName}`,
      );
      expect(result).toEqual([
        { firstName: "John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" },
      ]);
    });

    it("元の配列を変更しない（immutable）", () => {
      const original = [1, 2, 3, 2, 1];
      const copy = [...original];
      uniqBy(original, (n) => n);
      expect(original).toEqual(copy);
    });
  });
});
