import { vi } from "vitest";

/* eslint functional/immutable-data: off, functional/no-let: off */

export interface MockBookmarkTreeNode
  extends chrome.bookmarks.BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  dateAdded?: number;
  children?: MockBookmarkTreeNode[];
}

// Mock data store
const mockBookmarks = new Map<string, MockBookmarkTreeNode>();
let nextId = 1;

function generateId(): string {
  return (nextId++).toString();
}

function findBookmarksByTitle(title: string): MockBookmarkTreeNode[] {
  const results: MockBookmarkTreeNode[] = [];
  for (const bookmark of mockBookmarks.values()) {
    if (bookmark.title === title) {
      results.push(bookmark);
    }
  }
  return results;
}

function findBookmarksByQuery(query: string): MockBookmarkTreeNode[] {
  const results: MockBookmarkTreeNode[] = [];
  const lowerQuery = query.toLowerCase();
  for (const bookmark of mockBookmarks.values()) {
    if (
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery))
    ) {
      results.push(bookmark);
    }
  }
  return results;
}

function getChildrenOfParent(parentId: string): MockBookmarkTreeNode[] {
  const children: MockBookmarkTreeNode[] = [];
  for (const bookmark of mockBookmarks.values()) {
    if (bookmark.parentId === parentId) {
      children.push(bookmark);
    }
  }
  return children;
}

// Mock Chrome runtime
export const mockChromeRuntime = {
  getURL: vi.fn().mockImplementation((path: string): string => {
    return `chrome-extension://test-extension-id${path}`;
  }),
};

// Mock implementations
export const mockChromeBookmarks = {
  get: vi
    .fn()
    .mockImplementation(async (id: string): Promise<MockBookmarkTreeNode[]> => {
      const bookmark = mockBookmarks.get(id);
      if (!bookmark) {
        throw new Error(`Bookmark with id ${id} not found`);
      }
      return [bookmark];
    }),

  getChildren: vi
    .fn()
    .mockImplementation(async (id: string): Promise<MockBookmarkTreeNode[]> => {
      return getChildrenOfParent(id);
    }),

  search: vi
    .fn()
    .mockImplementation(
      async (query: {
        title?: string;
        query?: string;
      }): Promise<MockBookmarkTreeNode[]> => {
        if (query.title) {
          return findBookmarksByTitle(query.title);
        }
        if (query.query) {
          return findBookmarksByQuery(query.query);
        }
        return [];
      },
    ),

  create: vi
    .fn()
    .mockImplementation(
      async (bookmark: {
        parentId?: string;
        title: string;
        url?: string;
      }): Promise<MockBookmarkTreeNode> => {
        const id = generateId();
        const newBookmark: MockBookmarkTreeNode = {
          id,
          title: bookmark.title,
          url: bookmark.url,
          parentId: bookmark.parentId,
          dateAdded: Date.now(),
          syncing: false,
        };
        mockBookmarks.set(id, newBookmark);
        return newBookmark;
      },
    ),

  update: vi.fn().mockImplementation(
    async (
      id: string,
      changes: {
        title?: string;
        url?: string;
      },
    ): Promise<MockBookmarkTreeNode> => {
      const bookmark = mockBookmarks.get(id);
      if (!bookmark) {
        throw new Error(`Bookmark with id ${id} not found`);
      }

      const updatedBookmark = {
        ...bookmark,
        ...changes,
      };
      mockBookmarks.set(id, updatedBookmark);
      return updatedBookmark;
    },
  ),

  remove: vi.fn().mockImplementation(async (id: string): Promise<void> => {
    mockBookmarks.delete(id);
  }),
};

// Test utilities
export const mockBookmarkUtils = {
  clear: () => {
    mockBookmarks.clear();
    nextId = 1;
  },

  addMockBookmark: (
    bookmark: Partial<MockBookmarkTreeNode> & { title: string },
  ): MockBookmarkTreeNode => {
    const id = bookmark.id || generateId();
    const mockBookmark: MockBookmarkTreeNode = {
      id,
      title: bookmark.title,
      url: bookmark.url,
      parentId: bookmark.parentId,
      dateAdded: bookmark.dateAdded || Date.now(),
      syncing: false,
    };
    mockBookmarks.set(id, mockBookmark);
    return mockBookmark;
  },

  getMockBookmark: (id: string): MockBookmarkTreeNode | undefined => {
    return mockBookmarks.get(id);
  },

  getAllMockBookmarks: (): MockBookmarkTreeNode[] => {
    return Array.from(mockBookmarks.values());
  },

  createMockHierarchy: (rootTitle: string) => {
    const root = mockBookmarkUtils.addMockBookmark({
      id: "root",
      title: rootTitle,
    });

    const year2024 = mockBookmarkUtils.addMockBookmark({
      id: "year2024",
      title: "2024",
      parentId: root.id,
    });

    const month01 = mockBookmarkUtils.addMockBookmark({
      id: "month01",
      title: "01",
      parentId: year2024.id,
    });

    const day15 = mockBookmarkUtils.addMockBookmark({
      id: "day15",
      title: "15",
      parentId: month01.id,
    });

    const hour10 = mockBookmarkUtils.addMockBookmark({
      id: "hour10",
      title: "10",
      parentId: day15.id,
    });

    return { root, year2024, month01, day15, hour10 };
  },
};

// Setup global chrome object for tests
export function setupChromeBookmarksMock() {
  global.chrome = {
    bookmarks: mockChromeBookmarks as unknown as typeof chrome.bookmarks,
    runtime: mockChromeRuntime as unknown as typeof chrome.runtime,
  } as unknown as typeof global.chrome;
  mockBookmarks.clear();
  nextId = 1;
}

// Reset function for beforeEach in tests
export function resetChromeBookmarksMock() {
  mockBookmarkUtils.clear();
  vi.clearAllMocks();
}
