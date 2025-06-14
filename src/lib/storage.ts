import { HistoryItem } from "../types/HistoryItem";

const ROOT_FOLDER_NAME = "Eternal History";

// eslint-disable-next-line functional/no-let
let rootFolderId: string | null = null;

async function convertBookmarkToHistoryItem(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): Promise<HistoryItem> {
  const lastVisitTime = await getLastVisitTimeFromPath(bookmark);
  return {
    id: bookmark.id,
    url: bookmark.url!,
    title: bookmark.title,
    visitCount: 1,
    lastVisitTime,
    domain: new URL(bookmark.url!).hostname,
  };
}

export async function initializeStorage() {
  rootFolderId = await getOrCreateRootFolder();
}

async function getOrCreateRootFolder(): Promise<string> {
  const bookmarks = await chrome.bookmarks.search({ title: ROOT_FOLDER_NAME });
  const existing = bookmarks.find(
    (b) => !b.url && b.title === ROOT_FOLDER_NAME,
  );

  if (existing) {
    return existing.id;
  }

  const folder = await chrome.bookmarks.create({
    title: ROOT_FOLDER_NAME,
  });
  return folder.id;
}

async function getOrCreateFolder(
  parentId: string,
  title: string,
): Promise<string> {
  const children = await chrome.bookmarks.getChildren(parentId);
  const existing = children.find(
    (child) => !child.url && child.title === title,
  );

  if (existing) {
    return existing.id;
  }

  const folder = await chrome.bookmarks.create({
    parentId,
    title,
  });
  return folder.id;
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

  const date = new Date(history.lastVisitTime);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");

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

  if (queryTerms.length === 0) {
    return [];
  }

  // 最初の語で検索して候補を絞り込み
  const bookmarks = await filterAndConvertBookmarks(
    await chrome.bookmarks.search({
      query: queryTerms[0],
    }),
  );

  // 残りの語で絞り込み
  return bookmarks.filter((bookmark) => {
    const searchText = `${bookmark.title} ${bookmark.url}`.toLowerCase();
    return queryTerms.slice(1).every((term) => searchText.includes(term));
  });
}

async function filterAndConvertBookmarks(
  bookmarks: chrome.bookmarks.BookmarkTreeNode[],
): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const validBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => {
      if (
        bookmark.url &&
        rootFolderId &&
        (await isUnderFolder(bookmark, rootFolderId))
      ) {
        return await convertBookmarkToHistoryItem(bookmark);
      }
      return null;
    }),
  );

  return validBookmarks.filter((item): item is HistoryItem => item !== null);
}

async function isUnderFolder(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
  folderId: string,
): Promise<boolean> {
  const checkParent = async (
    currentId: string | undefined,
  ): Promise<boolean> => {
    if (!currentId) {
      return false;
    }

    if (currentId === folderId) {
      return true;
    }

    try {
      const parent = await chrome.bookmarks.get(currentId);
      return await checkParent(parent[0]?.parentId);
    } catch {
      return false;
    }
  };

  return await checkParent(bookmark.parentId);
}

export async function getRecentHistories(
  days: number = 3,
): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const today = new Date();

  const promises = Array.from({ length: days }, async (_, i) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);

    const year = targetDate.getFullYear().toString();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const day = targetDate.getDate().toString().padStart(2, "0");

    try {
      const yearFolderId = await getOrCreateFolder(rootFolderId!, year);
      const monthFolderId = await getOrCreateFolder(yearFolderId, month);
      const dayFolderId = await getOrCreateFolder(monthFolderId, day);

      return await getAllBookmarksInFolder(dayFolderId);
    } catch (error) {
      console.log(`No bookmarks found for ${year}/${month}/${day}`, error);
      return [];
    }
  });

  const dayBookmarksArrays = await Promise.all(promises);
  const historyBookmarks = dayBookmarksArrays.flat();

  return [...historyBookmarks].sort(
    (a, b) => b.lastVisitTime - a.lastVisitTime,
  );
}

async function getAllBookmarksInFolder(
  folderId: string,
): Promise<HistoryItem[]> {
  const children = await chrome.bookmarks.getChildren(folderId);

  const bookmarksPromises = children.map(async (child) => {
    if (child.url) {
      return [await convertBookmarkToHistoryItem(child)];
    } else {
      return await getAllBookmarksInFolder(child.id);
    }
  });

  const bookmarksArrays = await Promise.all(bookmarksPromises);
  return bookmarksArrays.flat();
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
