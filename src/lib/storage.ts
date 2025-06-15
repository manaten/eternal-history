import pMap from "p-map";

import {
  getOrCreateFolder,
  isUnderFolder,
  getAllBookmarksInFolder,
} from "./bookmark";
import { dateToFolderNames, getDateArray } from "./date";
import { HistoryItem } from "../types/HistoryItem";

export const ROOT_FOLDER_NAME = "Eternal History";

// eslint-disable-next-line functional/no-let
let rootFolderId: string | null = null;
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
  const lastVisitTime = await getLastVisitTimeFromPath(bookmark);
  return {
    id: bookmark.id,
    url: bookmark.url ?? "",
    title: bookmark.title,
    visitCount: 1,
    lastVisitTime,
    domain: bookmark.url ? new URL(bookmark.url).hostname : "",
  };
}

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

  if (existingBookmark) {
    // 既存のブックマークがあり、タイトルが異なる場合は更新
    if (existingBookmark.title !== history.title && history.title) {
      await chrome.bookmarks.update(existingBookmark.id, {
        title: history.title,
      });
      console.log("Updated bookmark title:", history.url, "->", history.title);
    }
  } else {
    // 新規作成
    await chrome.bookmarks.create({
      parentId: hourFolderId,
      title: history.title,
      url: history.url,
    });
  }
}

export async function search(query: string): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const queryTerms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => term.toLowerCase())
    .sort((a, b) => b.length - a.length);

  if (!queryTerms[0]) {
    return [];
  }

  // 最初の語で検索
  const bookmarks = await searchHistoriesByQuery(queryTerms[0]);

  // 残りの語で絞り込み
  return bookmarks.filter((bookmark) => {
    const searchText = `${bookmark.title} ${bookmark.url}`.toLowerCase();
    return queryTerms.slice(1).every((term) => searchText.includes(term));
  });
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
