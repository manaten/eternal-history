/**
 * 日付をフォルダ名として使用する文字列に変換します。
 * 年、月、日、時間を2桁のゼロパディングされた文字列として返します。
 *
 * @param date - 変換対象の日付オブジェクト
 * @returns 年、月、日、時間の文字列を含むオブジェクト
 *
 * @example
 * ```typescript
 * const date = new Date(2024, 0, 15, 9, 30, 0); // 2024年1月15日 09:30:00
 * const folderNames = dateToFolderNames(date);
 * // 結果: { year: "2024", month: "01", day: "15", hour: "09" }
 *
 * // フォルダ階層の作成に使用
 * const { year, month, day, hour } = dateToFolderNames(new Date());
 * const folderPath = `${year}/${month}/${day}/${hour}`;
 * ```
 */
export function dateToFolderNames(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
} {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  return { year, month, day, hour };
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("dateToFolderNames", () => {
    it("should convert date to folder names with zero-padded values", () => {
      const date = new Date(2024, 0, 1, 9, 30, 0); // January 1, 2024, 09:30:00
      const result = dateToFolderNames(date);

      expect(result).toEqual({
        year: "2024",
        month: "01",
        day: "01",
        hour: "09",
      });
    });

    it("should handle double-digit values correctly", () => {
      const date = new Date(2024, 11, 25, 23, 45, 0); // December 25, 2024, 23:45:00
      const result = dateToFolderNames(date);

      expect(result).toEqual({
        year: "2024",
        month: "12",
        day: "25",
        hour: "23",
      });
    });

    it("should handle edge cases like midnight", () => {
      const date = new Date(2024, 5, 15, 0, 0, 0); // June 15, 2024, 00:00:00
      const result = dateToFolderNames(date);

      expect(result).toEqual({
        year: "2024",
        month: "06",
        day: "15",
        hour: "00",
      });
    });
  });
}

/**
 * 指定された開始日から指定された日数分の日付配列を生成します。
 * 正の値の場合は未来方向、負の値の場合は過去方向の日付を生成します。
 *
 * @param start - 開始日となる日付オブジェクト
 * @param days - 生成する日数。正の値で未来方向、負の値で過去方向
 * @returns 生成された日付オブジェクトの配列
 *
 * @example
 * ```typescript
 * const today = new Date(2024, 0, 15); // 2024年1月15日
 *
 * // 未来3日間の日付を取得
 * const futureDates = getDateArray(today, 3);
 * // 結果: [2024-01-15, 2024-01-16, 2024-01-17]
 *
 * // 過去3日間の日付を取得
 * const pastDates = getDateArray(today, -3);
 * // 結果: [2024-01-15, 2024-01-14, 2024-01-13]
 *
 * // 各日付で処理を実行
 * getDateArray(new Date(), -7).forEach(date => {
 *   console.log(`Processing: ${date.toDateString()}`);
 * });
 * ```
 */
export function getDateArray(start: Date, days: number): Date[] {
  return Array.from({ length: Math.abs(days) }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i * Math.sign(days));
    return date;
  });
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getDateArray", () => {
    it("should generate array of dates for positive days", () => {
      const start = new Date(2024, 0, 1); // January 1, 2024
      const result = getDateArray(start, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date(2024, 0, 1)); // Jan 1
      expect(result[1]).toEqual(new Date(2024, 0, 2)); // Jan 2
      expect(result[2]).toEqual(new Date(2024, 0, 3)); // Jan 3
    });

    it("should generate array of dates for negative days", () => {
      const start = new Date(2024, 0, 5); // January 5, 2024
      const result = getDateArray(start, -3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date(2024, 0, 5)); // Jan 5
      expect(result[1]).toEqual(new Date(2024, 0, 4)); // Jan 4
      expect(result[2]).toEqual(new Date(2024, 0, 3)); // Jan 3
    });

    it("should handle zero days", () => {
      const start = new Date(2024, 0, 1);
      const result = getDateArray(start, 0);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle single day", () => {
      const start = new Date(2024, 0, 1);
      const result = getDateArray(start, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(new Date(2024, 0, 1));
    });

    it("should handle month boundaries", () => {
      const start = new Date(2024, 0, 30); // January 30, 2024
      const result = getDateArray(start, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date(2024, 0, 30)); // Jan 30
      expect(result[1]).toEqual(new Date(2024, 0, 31)); // Jan 31
      expect(result[2]).toEqual(new Date(2024, 1, 1)); // Feb 1
    });
  });
}
