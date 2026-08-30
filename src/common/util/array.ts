/**
 * 配列から重複を除去します。
 * keyFnで抽出されたキーが同じ要素は、最初に出現したものだけを残します。
 *
 * @param array - 処理対象の配列
 * @param keyFn - 各要素からキーを抽出する関数
 * @returns 重複を除去した新しい配列
 *
 * @example
 * ```ts
 * const items = [
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 1, name: 'Alice (duplicate)' }
 * ];
 * const unique = uniqBy(items, item => item.id);
 * // => [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 * ```
 */
export function uniqBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  return array.reduce<{ seen: Set<K>; result: T[] }>(
    (acc, item) => {
      const key = keyFn(item);
      return acc.seen.has(key)
        ? acc
        : {
            seen: new Set([...acc.seen, key]),
            result: [...acc.result, item],
          };
    },
    { seen: new Set(), result: [] },
  ).result;
}
