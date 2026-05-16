import pMap from "p-map";

import { getLastVisitTimeFromPath } from "./folder-path";
import {
  deserializeBookmarkToHistoryItem,
  serializeHistoryItemToBookmark,
} from "./serializer";
import { HistoryItem } from "../../domain/history/HistoryItem";
import { HistoryStore } from "../../domain/history/HistoryStore";
import { dateToFolderNames, getDateArray } from "../../util/date";
import {
  createBookmark,
  findBookmarkByUrlInFolder,
  getAllBookmarksInFolder,
  getOrCreateFolder,
  isUnderFolder,
  removeBookmark,
  resetBookmarkCacheForTesting,
  searchBookmarks,
  searchBookmarksByUrl,
  updateBookmarkTitle,
} from "../chrome/bookmark";
import { deleteUrlFromBrowserHistory } from "../chrome/chrome-history";

export const ROOT_FOLDER_NAME = "Eternal History";

// eslint-disable-next-line functional/no-let
let rootFolderId: string | null = null;

// Test helper function to reset storage state
export function resetStorageForTesting() {
  rootFolderId = null;
  resetBookmarkCacheForTesting();
}

async function initialize(): Promise<void> {
  rootFolderId = await getOrCreateFolder(undefined, ROOT_FOLDER_NAME);
}

async function convertBookmarkToHistoryItem(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): Promise<HistoryItem> {
  const item = deserializeBookmarkToHistoryItem(bookmark);

  if (item.lastVisitTime) {
    return item;
  }

  // メタデータから精密なタイムスタンプが取れない場合は
  // フォルダ階層からの復元にフォールバック
  return {
    ...item,
    lastVisitTime: await getLastVisitTimeFromPath(bookmark, ROOT_FOLDER_NAME),
  };
}

async function insertOne(history: HistoryItem): Promise<void> {
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

  const existingBookmark = await findBookmarkByUrlInFolder(
    hourFolderId,
    history.url,
  );

  const { title, url } = serializeHistoryItemToBookmark(history);

  if (existingBookmark) {
    if (existingBookmark.title !== title && title) {
      await updateBookmarkTitle(existingBookmark.id, title);
      console.log("Updated bookmark title:", history.url, "->", title);
    }
  } else {
    await createBookmark(hourFolderId, title, url);
  }
}

async function insert(items: HistoryItem[]): Promise<void> {
  if (!rootFolderId) {
    throw new Error("Storage not initialized");
  }

  for (const item of items) {
    console.log("Adding item:", item);
    await insertOne(item);
  }
  console.log("Inserted histories:", items.length);
}

async function searchCandidates(term: string): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const bookmarks = await searchBookmarks(term);
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

async function deleteHistory(item: HistoryItem): Promise<void> {
  if (!rootFolderId) {
    throw new Error("Storage not initialized");
  }

  try {
    const bookmarks = await searchBookmarksByUrl(item.url);

    for (const bookmark of bookmarks) {
      if (bookmark.url === item.url && rootFolderId) {
        const isUnder = await isUnderFolder(bookmark, rootFolderId);
        if (isUnder) {
          await removeBookmark(bookmark.id);
          console.log("Deleted bookmark item:", bookmark.id);
        }
      }
    }

    // Chrome 履歴本体からも削除し、UI 上の "完全に忘れる" 意図を満たす。
    await deleteUrlFromBrowserHistory(item.url);

    console.log("Deleted history item:", item.url);
  } catch (error) {
    console.error("Failed to delete history item:", error);
    throw error;
  }
}

async function getRecent(days: number): Promise<HistoryItem[]> {
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

/**
 * HistoryStore の Chrome bookmarks ベース実装。
 *
 * 履歴は "Eternal History" ルート配下の YYYY/MM/DD/HH 階層にブックマークとして
 * 永続化されます。メタデータはブックマークタイトル内に JSON で埋め込まれます。
 *
 * 検索の一次フィルタは chrome.bookmarks.search に委譲しています。
 */
export const bookmarkHistoryStore: HistoryStore = {
  initialize,
  insert,
  delete: deleteHistory,
  getRecent,
  searchCandidates,
};
