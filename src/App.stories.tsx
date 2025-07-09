import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

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
  id: "test-extension-id",
  lastError: null,
  onInstalled: {
    addListener: () => {},
    removeListener: () => {},
  },
  onStartup: {
    addListener: () => {},
    removeListener: () => {},
  },
  getManifest: () => ({
    name: "Eternal History Test",
    version: "1.0.0",
  }),
  getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
};

// グローバルにChrome APIをモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
(globalThis as any).chrome = {
  bookmarks: mockChromeBookmarks,
  history: mockChromeHistory,
  runtime: mockChromeRuntime,
};

const meta: Meta<typeof App> = {
  title: "App",
  component: App,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        // 各ストーリーの前にセッションストレージをクリア
        sessionStorage.clear();
      }, []);
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "デフォルト（セッションストレージなし）",
};

export const WithSessionStorageQuery: Story = {
  name: "セッションストレージにクエリがある場合",
  decorators: [
    (Story) => {
      useEffect(() => {
        sessionStorage.setItem("eternal-history-search-query", "react hooks");
      }, []);
      return <Story />;
    },
  ],
};

export const WithEmptySessionStorage: Story = {
  name: "セッションストレージが空文字の場合",
  decorators: [
    (Story) => {
      useEffect(() => {
        sessionStorage.setItem("eternal-history-search-query", "");
      }, []);
      return <Story />;
    },
  ],
};

export const WithLongQuery: Story = {
  name: "長いクエリがセッションストレージにある場合",
  decorators: [
    (Story) => {
      useEffect(() => {
        sessionStorage.setItem(
          "eternal-history-search-query",
          "react hooks useState useEffect useCallback useMemo",
        );
      }, []);
      return <Story />;
    },
  ],
};

export const SessionStorageError: Story = {
  name: "セッションストレージ読み取りエラー",
  decorators: [
    (Story) => {
      useEffect(() => {
        // sessionStorage.getItemをモックしてエラーを投げる
        const originalGetItem = sessionStorage.getItem;
        // eslint-disable-next-line functional/immutable-data
        sessionStorage.getItem = () => {
          throw new Error("Session storage not available");
        };

        return () => {
          // eslint-disable-next-line functional/immutable-data
          sessionStorage.getItem = originalGetItem;
        };
      }, []);
      return <Story />;
    },
  ],
};
