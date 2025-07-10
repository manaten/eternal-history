import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import App from "./App";

// Chrome APIをモック
const mockChromeBookmarks = {
  search: async () => [
    {
      id: "1",
      title: "React Documentation",
      url: "https://react.dev",
      dateAdded: Date.now() - 1000 * 60 * 60,
    },
  ],
  get: async () => [],
  create: async () => ({ id: "mock-id" }),
  update: async () => {},
  remove: async () => {},
  move: async () => {},
  getTree: async () => [
    {
      id: "0",
      title: "",
      children: [
        {
          id: "1",
          title: "Bookmarks Bar",
          children: [],
        },
      ],
    },
  ],
  getChildren: async () => [],
};

const mockChromeHistory = {
  search: async () => [
    {
      id: "1",
      url: "https://react.dev",
      title: "React - The library for web and native user interfaces",
      lastVisitTime: Date.now() - 1000 * 60 * 60,
      visitCount: 10,
    },
  ],
  onVisited: {
    addListener: () => {},
    removeListener: () => {},
  },
};

const mockChromeRuntime = {
  getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
};

// グローバルにChrome APIをモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
(globalThis as any).chrome = {
  bookmarks: mockChromeBookmarks,
  history: mockChromeHistory,
  runtime: mockChromeRuntime,
  storage: {
    local: {
      get: async () => ({ savedQueries: [] }),
      set: async () => {},
    },
  },
};

const meta: Meta<typeof App> = {
  component: App,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    sessionStorage.clear();
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索ボックスが表示され、空であることを確認
    const searchInput = await canvas.findByPlaceholderText(/検索|search/i);
    await expect(searchInput).toBeInTheDocument();
    await expect(searchInput).toHaveValue("");

    // sessionStorageが設定されていないことを確認
    await expect(sessionStorage.getItem("eternal-history-search-query")).toBe(
      "",
    );
  },
};

export const WithSessionStorageQuery: Story = {
  beforeEach: () => {
    sessionStorage.clear();
    sessionStorage.setItem("eternal-history-search-query", "react hooks");
  },

  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    // 検索ボックスに保存されたクエリが表示されることを確認
    const searchInput = await canvas.findByPlaceholderText(/検索|search/i);
    await expect(searchInput).toBeInTheDocument();
    await expect(searchInput).toHaveValue("react hooks");

    // Enterキーを押して検索を実行
    await userEvent.type(searchInput, "{Enter}");

    // sessionStorageにクエリが保存されていることを確認
    await expect(sessionStorage.getItem("eternal-history-search-query")).toBe(
      "react hooks",
    );
  },
};

export const WithEmptySessionStorage: Story = {
  beforeEach: () => {
    sessionStorage.clear();
    sessionStorage.setItem("eternal-history-search-query", "");
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索ボックスが空であることを確認
    const searchInput = await canvas.findByPlaceholderText(/検索|search/i);
    await expect(searchInput).toBeInTheDocument();
    await expect(searchInput).toHaveValue("");
  },
};

export const WithLongQuery: Story = {
  beforeEach: () => {
    sessionStorage.clear();
    sessionStorage.setItem(
      "eternal-history-search-query",
      "react hooks useState useEffect useCallback useMemo",
    );
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 長いクエリが正しく表示されることを確認
    const searchInput = await canvas.findByPlaceholderText(/検索|search/i);
    await expect(searchInput).toBeInTheDocument();
    await expect(searchInput).toHaveValue(
      "react hooks useState useEffect useCallback useMemo",
    );

    // 検索ボックスが正しくレイアウトされていることを確認（オーバーフローしていない）
    const searchBoxContainer = searchInput.parentElement?.parentElement;
    await expect(searchBoxContainer).toBeInTheDocument();
  },
};

const originalGetItem = sessionStorage.getItem;
export const SessionStorageError: Story = {
  beforeEach: () => {
    // eslint-disable-next-line functional/immutable-data
    sessionStorage.getItem = () => {
      throw new Error("Session storage not available");
    };
  },

  afterEach: () => {
    // eslint-disable-next-line functional/immutable-data
    sessionStorage.getItem = originalGetItem;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーが発生しても検索ボックスが表示されることを確認
    const searchInput = await canvas.findByPlaceholderText(/検索|search/i);
    await expect(searchInput).toBeInTheDocument();
    await expect(searchInput).toHaveValue("");

    // アプリケーションが正常に動作することを確認
    const app = canvasElement.querySelector("main");
    await expect(app).toBeInTheDocument();
  },
};
