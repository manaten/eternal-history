export const ROOT_FOLDER_NAME = "Eternal History";

export async function getOrCreateFolder(
  parentId: string | undefined,
  title: string,
): Promise<string> {
  const bookmarks = parentId
    ? await chrome.bookmarks.getChildren(parentId)
    : await chrome.bookmarks.search({ title });

  const existing = bookmarks.find((b) => !b.url && b.title === title);
  if (existing) {
    return existing.id;
  }

  const folder = await chrome.bookmarks.create({
    parentId,
    title,
  });
  return folder.id;
}

export async function isUnderFolder(
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

export async function getAllBookmarksInFolder(
  folderId: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  const children = await chrome.bookmarks.getChildren(folderId);

  const bookmarksPromises = children.map(async (child) => {
    if (child.url) {
      return [child];
    } else {
      return await getAllBookmarksInFolder(child.id);
    }
  });

  const bookmarksArrays = await Promise.all(bookmarksPromises);
  return bookmarksArrays.flat();
}

export async function getLastVisitTimeFromPath(
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
