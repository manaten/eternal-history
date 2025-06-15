import pMap from "p-map";

/**
 * フォルダを取得または作成します。
 * 指定された親フォルダ内に指定されたタイトルのフォルダが存在する場合はそのIDを返し、
 * 存在しない場合は新しいフォルダを作成してそのIDを返します。
 *
 * @param parentId - 親フォルダのID。undefinedの場合はルートフォルダを検索します
 * @param title - 作成または取得するフォルダのタイトル
 * @returns フォルダのIDを返すPromise
 *
 * @example
 * ```typescript
 * // 親フォルダ内にサブフォルダを作成/取得
 * const folderId = await getOrCreateFolder("parent123", "2024");
 *
 * // ルートレベルでフォルダを作成/取得
 * const rootId = await getOrCreateFolder(undefined, "Eternal History");
 * ```
 */
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

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach } = import.meta.vitest;
  const {
    setupChromeBookmarksMock,
    resetChromeBookmarksMock,
    mockBookmarkUtils,
  } = await import("./__mocks__/chrome_bookmarks.mock");

  const ROOT_FOLDER_NAME = "Eternal History";

  describe("getOrCreateFolder", () => {
    beforeEach(() => {
      setupChromeBookmarksMock();
      resetChromeBookmarksMock();
    });

    it("should create a new folder when it doesn't exist", async () => {
      const result = await getOrCreateFolder("parent1", "New Folder");

      expect(result).toBe("1");
      expect(chrome.bookmarks.create).toHaveBeenCalledWith({
        parentId: "parent1",
        title: "New Folder",
      });
    });

    it("should return existing folder id when folder exists", async () => {
      // Setup existing folder
      mockBookmarkUtils.addMockBookmark({
        id: "existing1",
        title: "Existing Folder",
        parentId: "parent1",
      });

      const result = await getOrCreateFolder("parent1", "Existing Folder");

      expect(result).toBe("existing1");
      expect(chrome.bookmarks.create).not.toHaveBeenCalled();
    });

    it("should search by title when parentId is undefined", async () => {
      const result = await getOrCreateFolder(undefined, ROOT_FOLDER_NAME);

      expect(chrome.bookmarks.search).toHaveBeenCalledWith({
        title: ROOT_FOLDER_NAME,
      });
      expect(result).toBe("1");
    });

    it("should return existing root folder when found by search", async () => {
      // Setup existing root folder
      mockBookmarkUtils.addMockBookmark({
        id: "root1",
        title: ROOT_FOLDER_NAME,
      });

      const result = await getOrCreateFolder(undefined, ROOT_FOLDER_NAME);

      expect(result).toBe("root1");
      expect(chrome.bookmarks.create).not.toHaveBeenCalled();
    });

    it("should ignore bookmarks with URLs when looking for folders", async () => {
      // Setup bookmark with URL (not a folder)
      mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Test Folder",
        parentId: "parent1",
        url: "https://example.com",
      });

      const result = await getOrCreateFolder("parent1", "Test Folder");

      // Should create new folder instead of returning bookmark
      expect(result).toBe("1");
      expect(chrome.bookmarks.create).toHaveBeenCalled();
    });
  });
}

/**
 * 指定されたブックマークが特定のフォルダの配下にあるかどうかを判定します。
 * 直接の親子関係だけでなく、階層を遡って祖先フォルダも検索します。
 *
 * @param bookmark - 判定対象のブックマークノード
 * @param folderId - 検索対象のフォルダID
 * @returns ブックマークが指定フォルダの配下にある場合はtrue、そうでなければfalseを返すPromise
 *
 * @example
 * ```typescript
 * const bookmark = { id: "b1", parentId: "folder1", title: "Example", url: "https://example.com" };
 *
 * // 直接の親フォルダかチェック
 * const isDirectChild = await isUnderFolder(bookmark, "folder1"); // true
 *
 * // 祖先フォルダかチェック
 * const isAncestor = await isUnderFolder(bookmark, "rootFolder"); // trueまたはfalse
 * ```
 */
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

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach } = import.meta.vitest;
  const {
    setupChromeBookmarksMock,
    resetChromeBookmarksMock,
    mockBookmarkUtils,
  } = await import("./__mocks__/chrome_bookmarks.mock");

  describe("isUnderFolder", () => {
    beforeEach(() => {
      setupChromeBookmarksMock();
      resetChromeBookmarksMock();
    });

    it("should return true when bookmark is directly under the folder", async () => {
      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Test Bookmark",
        parentId: "folder1",
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "folder1");

      expect(result).toBe(true);
    });

    it("should return true when bookmark is nested under the folder", async () => {
      // Create hierarchy: rootFolder -> subFolder -> bookmark
      const subFolder = mockBookmarkUtils.addMockBookmark({
        id: "subfolder1",
        title: "Sub Folder",
        parentId: "rootfolder1",
      });

      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Test Bookmark",
        parentId: subFolder.id,
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "rootfolder1");

      expect(result).toBe(true);
    });

    it("should return false when bookmark is not under the folder", async () => {
      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Test Bookmark",
        parentId: "otherfolder1",
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "targetfolder1");

      expect(result).toBe(false);
    });

    it("should return false when bookmark has no parent", async () => {
      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Root Bookmark",
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "folder1");

      expect(result).toBe(false);
    });

    it("should handle chrome.bookmarks.get errors gracefully", async () => {
      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Test Bookmark",
        parentId: "nonexistent",
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "folder1");

      expect(result).toBe(false);
    });

    it("should return true when bookmark is deeply nested", async () => {
      // Create deep hierarchy: root -> level1 -> level2 -> level3 -> bookmark
      const level1 = mockBookmarkUtils.addMockBookmark({
        id: "level1",
        title: "Level 1",
        parentId: "root",
      });

      const level2 = mockBookmarkUtils.addMockBookmark({
        id: "level2",
        title: "Level 2",
        parentId: level1.id,
      });

      const level3 = mockBookmarkUtils.addMockBookmark({
        id: "level3",
        title: "Level 3",
        parentId: level2.id,
      });

      const bookmark = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Deep Bookmark",
        parentId: level3.id,
        url: "https://example.com",
      });

      const result = await isUnderFolder(bookmark, "root");

      expect(result).toBe(true);
    });
  });
}

/**
 * 指定されたフォルダ内のすべてのブックマーク（URLを持つノード）を再帰的に取得します。
 * サブフォルダも含めて階層全体を検索し、フォルダ自体は除外してブックマークのみを返します。
 *
 * @param folderId - 検索対象のフォルダID
 * @returns フォルダ内のすべてのブックマークノードの配列を返すPromise
 *
 * @example
 * ```typescript
 * // フォルダ内のすべてのブックマークを取得
 * const bookmarks = await getAllBookmarksInFolder("folder123");
 *
 * // 結果例: [
 * //   { id: "b1", title: "Example", url: "https://example.com", parentId: "folder123" },
 * //   { id: "b2", title: "Test", url: "https://test.com", parentId: "subfolder456" }
 * // ]
 *
 * // 各ブックマークを処理
 * for (const bookmark of bookmarks) {
 *   console.log(`${bookmark.title}: ${bookmark.url}`);
 * }
 * ```
 */
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

if (import.meta.vitest) {
  const { describe, it, expect, beforeEach } = import.meta.vitest;
  const {
    setupChromeBookmarksMock,
    resetChromeBookmarksMock,
    mockBookmarkUtils,
  } = await import("./__mocks__/chrome_bookmarks.mock");

  describe("getAllBookmarksInFolder", () => {
    beforeEach(() => {
      setupChromeBookmarksMock();
      resetChromeBookmarksMock();
    });

    it("should return only bookmarks (with URLs) from a folder", async () => {
      // Setup folder with bookmarks and subfolders
      const bookmark1 = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Bookmark 1",
        parentId: "folder1",
        url: "https://example1.com",
      });

      const bookmark2 = mockBookmarkUtils.addMockBookmark({
        id: "bookmark2",
        title: "Bookmark 2",
        parentId: "folder1",
        url: "https://example2.com",
      });

      // Add a subfolder (should be ignored)
      mockBookmarkUtils.addMockBookmark({
        id: "subfolder1",
        title: "Sub Folder",
        parentId: "folder1",
      });

      const otherBookmark = mockBookmarkUtils.addMockBookmark({
        id: "otherBookmark",
        title: "Other Bookmark",
        parentId: "other",
        url: "https://other.com",
      });

      const result = await getAllBookmarksInFolder("folder1");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(bookmark1);
      expect(result).toContainEqual(bookmark2);
      expect(result).not.toContainEqual(otherBookmark);
    });

    it("should recursively get bookmarks from subfolders", async () => {
      // Setup nested structure
      const rootBookmark = mockBookmarkUtils.addMockBookmark({
        id: "rootBookmark",
        title: "Root Bookmark",
        parentId: "folder1",
        url: "https://root.com",
      });

      const subFolder = mockBookmarkUtils.addMockBookmark({
        id: "subfolder1",
        title: "Sub Folder",
        parentId: "folder1",
      });

      const subBookmark = mockBookmarkUtils.addMockBookmark({
        id: "subBookmark",
        title: "Sub Bookmark",
        parentId: subFolder.id,
        url: "https://sub.com",
      });

      const result = await getAllBookmarksInFolder("folder1");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(rootBookmark);
      expect(result).toContainEqual(subBookmark);
    });

    it("should return empty array when folder has no bookmarks", async () => {
      // Setup empty folder
      mockBookmarkUtils.addMockBookmark({
        id: "emptyfolder1",
        title: "Empty Folder",
        parentId: "parent1",
      });

      const result = await getAllBookmarksInFolder("emptyfolder1");

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle deeply nested folder structures", async () => {
      // Create deep nesting: folder1 -> level1 -> level2 -> bookmark
      const level1 = mockBookmarkUtils.addMockBookmark({
        id: "level1",
        title: "Level 1",
        parentId: "folder1",
      });

      const level2 = mockBookmarkUtils.addMockBookmark({
        id: "level2",
        title: "Level 2",
        parentId: level1.id,
      });

      const deepBookmark = mockBookmarkUtils.addMockBookmark({
        id: "deepBookmark",
        title: "Deep Bookmark",
        parentId: level2.id,
        url: "https://deep.com",
      });

      const result = await getAllBookmarksInFolder("folder1");

      expect(result).toHaveLength(1);
      expect(result).toContainEqual(deepBookmark);
    });

    it("should handle folders with only subfolders (no direct bookmarks)", async () => {
      // Setup folder with only subfolders
      const subFolder1 = mockBookmarkUtils.addMockBookmark({
        id: "subfolder1",
        title: "Sub Folder 1",
        parentId: "folder1",
      });

      const subFolder2 = mockBookmarkUtils.addMockBookmark({
        id: "subfolder2",
        title: "Sub Folder 2",
        parentId: "folder1",
      });

      // Add bookmarks only in subfolders
      const bookmark1 = mockBookmarkUtils.addMockBookmark({
        id: "bookmark1",
        title: "Bookmark in Sub 1",
        parentId: subFolder1.id,
        url: "https://sub1.com",
      });

      const bookmark2 = mockBookmarkUtils.addMockBookmark({
        id: "bookmark2",
        title: "Bookmark in Sub 2",
        parentId: subFolder2.id,
        url: "https://sub2.com",
      });

      const otherBookmark = mockBookmarkUtils.addMockBookmark({
        id: "otherBookmark",
        title: "Other Bookmark",
        parentId: "other",
        url: "https://other.com",
      });

      const result = await getAllBookmarksInFolder("folder1");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(bookmark1);
      expect(result).toContainEqual(bookmark2);
      expect(result).not.toContainEqual(otherBookmark);
    });
  });
}
