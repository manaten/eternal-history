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

  await chrome.bookmarks.create({
    parentId: hourFolderId,
    title: history.title,
    url: history.url,
  });
}

export async function search(query: string): Promise<HistoryItem[]> {
  if (!rootFolderId) {
    return [];
  }

  const bookmarks = await chrome.bookmarks.search({ query });
  const historyBookmarks: HistoryItem[] = [];

  for (const bookmark of bookmarks) {
    if (bookmark.url && (await isUnderFolder(bookmark, rootFolderId))) {
      historyBookmarks.push({
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        visitCount: 1,
        lastVisitTime: bookmark.dateAdded || Date.now(),
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

export async function save() {
  // ブックマークベースの場合、保存は自動的に行われる
}
