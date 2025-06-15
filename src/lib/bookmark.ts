import pMap from "p-map";

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
  const bookmarksArrays = await pMap(children, async (child) => {
    if (child.url) {
      return [child];
    } else {
      return await getAllBookmarksInFolder(child.id);
    }
  });
  return bookmarksArrays.flat();
}
