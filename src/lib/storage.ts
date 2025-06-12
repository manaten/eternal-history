import { HistoryItem } from "../types/HistoryItem";

const ROOT_FOLDER_NAME = "Eternal History";

let rootFolderId: string | null = null;

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

export async function insertHistories(data: HistoryItem[]) {
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
  const isDuplicate = existingBookmarks.some(
    (bookmark) => bookmark.url === history.url,
  );

  if (!isDuplicate) {
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

  const bookmarks = await chrome.bookmarks.search({ query });
  const historyBookmarks: HistoryItem[] = [];

  for (const bookmark of bookmarks) {
    if (bookmark.url && (await isUnderFolder(bookmark, rootFolderId))) {
      const lastVisitTime = await getLastVisitTimeFromPath(bookmark);
      historyBookmarks.push({
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        visitCount: 1,
        lastVisitTime,
        domain: new URL(bookmark.url).hostname,
      });
    }
  }

  return historyBookmarks;
}

async function isUnderFolder(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
  folderId: string,
): Promise<boolean> {
  let currentId = bookmark.parentId;

  while (currentId) {
    if (currentId === folderId) {
      return true;
    }

    try {
      const parent = await chrome.bookmarks.get(currentId);
      currentId = parent[0]?.parentId;
    } catch {
      break;
    }
  }

  return false;
}

export async function getRecentHistories(
  days: number = 3,
): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const historyBookmarks: HistoryItem[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);

    const year = targetDate.getFullYear().toString();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const day = targetDate.getDate().toString().padStart(2, "0");

    try {
      const yearFolderId = await getOrCreateFolder(rootFolderId, year);
      const monthFolderId = await getOrCreateFolder(yearFolderId, month);
      const dayFolderId = await getOrCreateFolder(monthFolderId, day);

      const dayBookmarks = await getAllBookmarksInFolder(dayFolderId);
      historyBookmarks.push(...dayBookmarks);
    } catch (error) {
      console.log(`No bookmarks found for ${year}/${month}/${day}`, error);
    }
  }

  return historyBookmarks.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
}

async function getAllBookmarksInFolder(
  folderId: string,
): Promise<HistoryItem[]> {
  const children = await chrome.bookmarks.getChildren(folderId);
  const bookmarks: HistoryItem[] = [];

  for (const child of children) {
    if (child.url) {
      const lastVisitTime = await getLastVisitTimeFromPath(child);
      bookmarks.push({
        id: child.id,
        url: child.url,
        title: child.title,
        visitCount: 1,
        lastVisitTime,
        domain: new URL(child.url).hostname,
      });
    } else {
      const subBookmarks = await getAllBookmarksInFolder(child.id);
      bookmarks.push(...subBookmarks);
    }
  }

  return bookmarks;
}

async function getLastVisitTimeFromPath(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): Promise<number> {
  try {
    const pathParts: string[] = [];
    let currentId = bookmark.parentId;

    // ディレクトリ階層を逆順で取得 (hour -> day -> month -> year)
    while (currentId) {
      const parent = await chrome.bookmarks.get(currentId);
      const parentNode = parent[0];
      if (!parentNode) break;

      // ルートフォルダに到達したら停止
      if (parentNode.title === ROOT_FOLDER_NAME) {
        break;
      }

      pathParts.unshift(parentNode.title);
      currentId = parentNode.parentId;
    }

    // pathParts は [year, month, day, hour] の順番
    if (pathParts.length >= 4) {
      const [year, month, day, hour] = pathParts;
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
