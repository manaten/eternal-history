import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  setupChromeBookmarksMock,
  resetChromeBookmarksMock,
  mockBookmarkUtils,
} from "./__mocks__/chrome_bookmarks.mock";
import {
  getAllBookmarksInFolder,
  getOrCreateFolder,
  isUnderFolder,
} from "./bookmark";

const ROOT_FOLDER_NAME = "Eternal History";

describe("getOrCreateFolder", () => {
  beforeEach(() => {
    setupChromeBookmarksMock();
    resetChromeBookmarksMock();
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
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
