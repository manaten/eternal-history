import pMap from "p-map";

import {
  getOrCreateFolder,
  isUnderFolder,
  getAllBookmarksInFolder,
} from "./bookmark";
import {
  deserializeBookmarkToHistoryItem,
  serializeHistoryItemToBookmark,
} from "./bookmark-serializer";
import { dateToFolderNames, getDateArray } from "./date";
import { parseSearchQuery } from "./query";
import { HistoryItem } from "../types/HistoryItem";

export interface SearchOptions {
  groupByUrl?: boolean;
  groupByTitle?: boolean;
}

export const ROOT_FOLDER_NAME = "Eternal History";

// eslint-disable-next-line functional/no-let
let rootFolderId: string | null = null;

// Test helper function to reset storage state
export function resetStorageForTesting() {
  rootFolderId = null;
}

/**
 * ストレージシステムを初期化します。
 * ルートフォルダ（"Eternal History"）を取得または作成し、以降の操作で使用するために保存します。
 * この関数は他のストレージ操作を行う前に必ず呼び出す必要があります。
 *
 * @returns 初期化完了を示すPromise
 * @throws {Error} ルートフォルダの作成に失敗した場合
 *
 * @example
 * ```typescript
 * // アプリケーション起動時に初期化
 * try {
 *   await initializeStorage();
 *   console.log("Storage initialized successfully");
 * } catch (error) {
 *   console.error("Failed to initialize storage:", error);
 * }
 * ```
 */
export async function initializeStorage() {
  rootFolderId = await getOrCreateFolder(undefined, ROOT_FOLDER_NAME);
}

async function getLastVisitTimeFromPath(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): Promise<number> {
  try {
    const getPathParts = async (
      currentId: string | undefined,
    ): Promise<string[]> => {
      if (!currentId) {
        return [];
      }

      const parent = await chrome.bookmarks.get(currentId);
      const parentNode = parent[0];
      if (!parentNode || parentNode.title === ROOT_FOLDER_NAME) {
        return [];
      }

      const restPath = await getPathParts(parentNode.parentId);
      return [...restPath, parentNode.title];
    };

    const pathParts = await getPathParts(bookmark.parentId);

    // pathParts は [year, month, day, hour] の順番
    const [year, month, day, hour] = pathParts;
    if (year && month && day && hour) {
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1, // monthは0ベース
        parseInt(day),
        parseInt(hour),
      );
      return date.getTime();
    }
  } catch (error) {
    console.warn("Failed to parse date from bookmark path:", error);
  }

  // フォールバック: dateAddedを使用
  return bookmark.dateAdded || Date.now();
}

async function convertBookmarkToHistoryItem(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): Promise<HistoryItem> {
  const item = deserializeBookmarkToHistoryItem(bookmark);

  // If no precise timestamp from metadata, fall back to folder-based calculation
  const lastVisitTime =
    item.lastVisitTime || (await getLastVisitTimeFromPath(bookmark));

  return {
    ...item,
    lastVisitTime,
  };
}

/**
 * 履歴アイテムをブックマークとして保存します。
 * 各履歴アイテムは日時に基づいた階層フォルダ（年/月/日/時）に整理されて保存されます。
 * 同じURLの既存ブックマークがある場合は、タイトルが異なる場合のみ更新されます。
 *
 * @param data - 保存する履歴アイテムの配列
 * @throws {Error} ストレージが初期化されていない場合
 *
 * @example
 * ```typescript
 * // 単一の履歴アイテムを保存
 * await insertHistories({
 *   id: "1",
 *   url: "https://example.com",
 *   title: "Example Site",
 *   visitCount: 1,
 *   lastVisitTime: Date.now(),
 *   domain: "example.com"
 * });
 *
 * // 複数の履歴アイテムを一括保存
 * await insertHistories(
 *   { id: "1", url: "https://site1.com", title: "Site 1", ... },
 *   { id: "2", url: "https://site2.com", title: "Site 2", ... }
 * );
 * ```
 */
export async function insertHistories(...data: HistoryItem[]) {
  if (!rootFolderId) {
    throw new Error("Storage not initialized");
  }

  for (const item of data) {
    console.log("Adding item:", item);
    await insertHistoryAsBookmark(item);
  }
  console.log("Inserted histories:", data.length);
}

async function insertHistoryAsBookmark(history: HistoryItem) {
  if (!rootFolderId) {
    throw new Error("Storage not initialized");
  }

  const { year, month, day, hour } = dateToFolderNames(
    new Date(history.lastVisitTime),
  );

  const yearFolderId = await getOrCreateFolder(rootFolderId, year);
  const monthFolderId = await getOrCreateFolder(yearFolderId, month);
  const dayFolderId = await getOrCreateFolder(monthFolderId, day);
  const hourFolderId = await getOrCreateFolder(dayFolderId, hour);

  // 同じURLのブックマークが既に存在するかチェック
  const existingBookmarks = await chrome.bookmarks.getChildren(hourFolderId);
  const existingBookmark = existingBookmarks.find(
    (bookmark) => bookmark.url === history.url,
  );

  // Serialize to bookmark format
  const { title, url } = serializeHistoryItemToBookmark(history);

  if (existingBookmark) {
    // 既存のブックマークがあり、タイトルが異なる場合は更新
    if (existingBookmark.title !== title && title) {
      await chrome.bookmarks.update(existingBookmark.id, {
        title,
      });
      console.log("Updated bookmark title:", history.url, "->", title);
    }
  } else {
    // 新規作成
    await chrome.bookmarks.create({
      parentId: hourFolderId,
      title,
      url,
    });
  }
}

/**
 * 検索結果をグルーピングします。
 * 同一URLまたは同一タイトルの結果をまとめ、最新のものだけを残します。
 */
function groupHistories(
  items: HistoryItem[],
  options?: SearchOptions,
): HistoryItem[] {
  if (!options?.groupByUrl && !options?.groupByTitle) {
    return items;
  }

  // 最新順にソート
  const sorted = [...items].sort((a, b) => b.lastVisitTime - a.lastVisitTime);

  // URLでグルーピング（最初に出現したものを残す = 最新のもの）
  const afterUrlGrouping = options.groupByUrl
    ? sorted.reduce<{ seen: Set<string>; result: HistoryItem[] }>(
        (acc, item) =>
          acc.seen.has(item.url)
            ? acc
            : {
                seen: new Set([...acc.seen, item.url]),
                result: [...acc.result, item],
              },
        { seen: new Set(), result: [] },
      ).result
    : sorted;

  // タイトルでグルーピング
  const afterTitleGrouping = options.groupByTitle
    ? afterUrlGrouping.reduce<{ seen: Set<string>; result: HistoryItem[] }>(
        (acc, item) => {
          const title = item.title || "";
          return acc.seen.has(title)
            ? acc
            : {
                seen: new Set([...acc.seen, title]),
                result: [...acc.result, item],
              };
        },
        { seen: new Set(), result: [] },
      ).result
    : afterUrlGrouping;

  return afterTitleGrouping;
}

/**
 * 保存された履歴アイテムを検索します。
 * クエリ文字列をスペースで分割し、すべての単語がタイトルまたはURLに含まれるアイテムを返します。
 * site:example.com構文でドメイン検索も可能です。
 * 検索対象は "Eternal History" フォルダ配下のブックマークのみです。
 *
 * @param query - 検索クエリ文字列（スペース区切りで複数単語指定可能、site:ドメイン指定可能）
 * @param options - 検索オプション（groupByUrl, groupByTitle）
 * @returns マッチした履歴アイテムの配列を返すPromise
 *
 * @example
 * ```typescript
 * // 単一単語での検索
 * const results1 = await search("google");
 *
 * // 複数単語での検索（AND検索）
 * const results2 = await search("google search engine");
 *
 * // ドメイン検索
 * const results3 = await search("site:example.com");
 *
 * // ドメイン検索と単語の組み合わせ
 * const results4 = await search("site:google.com search");
 *
 * // グルーピングオプション付き検索
 * const results5 = await search("google", { groupByUrl: true });
 *
 * // 検索結果を表示
 * results2.forEach(item => {
 *   console.log(`${item.title}: ${item.url}`);
 * });
 *
 * // 空のクエリは空配列を返す
 * const empty = await search("   "); // []
 * ```
 */
export async function search(
  query: string,
  options?: SearchOptions,
): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const parsedTerms = parseSearchQuery(query);

  // 除外タームのみの場合は空配列を返す
  const nonExcludeTerms = parsedTerms.filter((term) => term.type !== "exclude");
  if (!nonExcludeTerms[0]) {
    return [];
  }

  // まず最初の非除外単語で全体から検索
  const bookmarks = await searchHistoriesByQuery(nonExcludeTerms[0].term);

  // フィルタリング
  const filtered = bookmarks.filter((bookmark) => {
    const searchText = `${bookmark.title} ${bookmark.url}`.toLowerCase();

    return parsedTerms.every((parsedTerm) => {
      // 除外条件
      if (parsedTerm.type === "exclude") {
        return !searchText.includes(parsedTerm.term);
      }

      // site:条件は hostname に対してチェック
      if (parsedTerm.type === "site") {
        try {
          const url = new URL(bookmark.url);
          return url.hostname.includes(parsedTerm.term);
        } catch {
          return false;
        }
      }

      // text条件は title と url 全体に対してチェック
      return searchText.includes(parsedTerm.term);
    });
  });

  // グルーピング処理
  return groupHistories(filtered, options);
}

async function searchHistoriesByQuery(query: string): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const bookmarks = await chrome.bookmarks.search({ query });
  return (
    await pMap(bookmarks, async (bookmark) => {
      if (
        bookmark.url &&
        rootFolderId &&
        (await isUnderFolder(bookmark, rootFolderId))
      ) {
        return await convertBookmarkToHistoryItem(bookmark);
      }
      return null;
    })
  ).filter((item) => item !== null);
}

/**
 * 履歴アイテムを削除します。
 * 対応するブックマークとChrome履歴の両方から削除されます。
 *
 * @param historyItem - 削除する履歴アイテム
 * @throws {Error} ストレージが初期化されていない場合
 *
 * @example
 * ```typescript
 * // 履歴アイテムを削除
 * await deleteHistoryItem(item);
 * ```
 */
export async function deleteHistoryItem(
  historyItem: HistoryItem,
): Promise<void> {
  if (!rootFolderId) {
    throw new Error("Storage not initialized");
  }

  try {
    // ブックマークから削除
    const bookmarks = await chrome.bookmarks.search({ url: historyItem.url });

    // Find the bookmark under our root folder
    for (const bookmark of bookmarks) {
      if (bookmark.url === historyItem.url && rootFolderId) {
        const isUnder = await isUnderFolder(bookmark, rootFolderId);
        if (isUnder) {
          await chrome.bookmarks.remove(bookmark.id);
          console.log("Deleted bookmark item:", bookmark.id);
        }
      }
    }

    // Chrome履歴からも削除
    await chrome.history.deleteUrl({ url: historyItem.url });

    console.log("Deleted history item:", historyItem.url);
  } catch (error) {
    console.error("Failed to delete history item:", error);
    throw error;
  }
}

/**
 * 指定された日数分の最近の履歴アイテムを取得します。
 * 今日から過去に向かって指定日数分のフォルダを検索し、見つかったブックマークを
 * 最終訪問時刻の降順（新しい順）でソートして返します。
 *
 * @param days - 取得する日数（デフォルト: 3日）
 * @returns 最近の履歴アイテムの配列を返すPromise（最終訪問時刻の降順）
 *
 * @example
 * ```typescript
 * // デフォルト（3日間）の履歴を取得
 * const recent = await getRecentHistories();
 *
 * // 過去7日間の履歴を取得
 * const weeklyHistory = await getRecentHistories(7);
 *
 * // 結果を表示
 * recent.forEach(item => {
 *   const date = new Date(item.lastVisitTime);
 *   console.log(`${date.toLocaleString()}: ${item.title}`);
 * });
 *
 * // 最新の10件のみ取得
 * const latest = (await getRecentHistories(7)).slice(0, 10);
 * ```
 */
export async function getRecentHistories(
  days: number = 3,
): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const dayBookmarksArrays = await pMap(
    getDateArray(new Date(), -days),
    async (targetDate) => {
      const { year, month, day } = dateToFolderNames(targetDate);

      try {
        const yearFolderId = await getOrCreateFolder(rootFolderId!, year);
        const monthFolderId = await getOrCreateFolder(yearFolderId, month);
        const dayFolderId = await getOrCreateFolder(monthFolderId, day);

        const bookmarks = await getAllBookmarksInFolder(dayFolderId);
        return await pMap(bookmarks, convertBookmarkToHistoryItem);
      } catch (error) {
        console.log(`No bookmarks found for ${year}/${month}/${day}`, error);
        return [];
      }
    },
  );

  const historyBookmarks = dayBookmarksArrays.flat();
  return [...historyBookmarks].sort(
    (a, b) => b.lastVisitTime - a.lastVisitTime,
  );
}
