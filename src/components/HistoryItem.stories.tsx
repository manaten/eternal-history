import type { Meta, StoryObj } from "@storybook/react-vite";

import { HistoryItem } from "./HistoryItem";

const meta: Meta<typeof HistoryItem> = {
  title: "Components/HistoryItem",
  component: HistoryItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{
          width: "600px",
          maxWidth: "100%",
          margin: "0 auto",
          background: "#fff",
          padding: "1rem",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHistoryItem = {
  id: "1",
  url: "https://example.com",
  title: "Example Website",
  visitCount: 5,
  lastVisitTime: Date.now(),
  domain: "example.com",
};

export const Default: Story = {
  args: {
    item: mockHistoryItem,
  },
};

export const LongTitle: Story = {
  args: {
    item: {
      ...mockHistoryItem,
      title:
        "This is a very long title that should be truncated at some point to prevent the layout from breaking and show how the component handles overflow text",
      url: "https://very-long-domain-name-that-might-overflow.example.com/very/long/path/that/might/also/overflow",
    },
  },
};

export const NoTitle: Story = {
  args: {
    item: {
      ...mockHistoryItem,
      title: "",
    },
  },
};

export const RecentVisit: Story = {
  args: {
    item: {
      ...mockHistoryItem,
      lastVisitTime: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    },
  },
};

export const OldVisit: Story = {
  args: {
    item: {
      ...mockHistoryItem,
      lastVisitTime: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
    },
  },
};

export const GitHubExample: Story = {
  args: {
    item: {
      id: "2",
      url: "https://github.com/facebook/react",
      title:
        "GitHub - facebook/react: The library for web and native user interfaces",
      visitCount: 10,
      lastVisitTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      domain: "github.com",
    },
  },
};

export const ExtremelyLongText: Story = {
  args: {
    item: {
      id: "3",
      url: "https://this-is-an-extremely-long-domain-name-that-should-definitely-overflow-and-cause-layout-issues-if-not-handled-properly.example.com/and/this/is/a/very/long/path/with/many/segments/that/could/also/cause/problems/if/the/css/is/not/working/correctly",
      title:
        "これは非常に長いタイトルのテストケースです。このタイトルは確実にコンポーネントの幅を超えて、レイアウトに問題を引き起こす可能性があります。省略記号が正しく表示されるかテストするためのものです。",
      visitCount: 1,
      lastVisitTime: Date.now(),
      domain:
        "this-is-an-extremely-long-domain-name-that-should-definitely-overflow-and-cause-layout-issues-if-not-handled-properly.example.com",
    },
  },
};

export const WithSearchHighlight: Story = {
  args: {
    item: {
      id: "5",
      url: "https://github.com/facebook/react",
      title:
        "GitHub - facebook/react: The library for web and native user interfaces",
      visitCount: 15,
      lastVisitTime: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      domain: "github.com",
    },
    searchQuery: "github react",
  },
};

export const WithJapaneseHighlight: Story = {
  args: {
    item: {
      id: "6",
      url: "https://ja.wikipedia.org/wiki/プログラミング",
      title: "プログラミング - Wikipedia",
      visitCount: 8,
      lastVisitTime: Date.now() - 60 * 60 * 1000, // 1 hour ago
      domain: "ja.wikipedia.org",
    },
    searchQuery: "プログラミング wiki",
  },
};

export const WithPartialHighlight: Story = {
  args: {
    item: {
      id: "7",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
      title: "JavaScript reference - JavaScript | MDN",
      visitCount: 12,
      lastVisitTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      domain: "developer.mozilla.org",
    },
    searchQuery: "script mdn",
  },
};

export const WithMultipleMatches: Story = {
  args: {
    item: {
      id: "8",
      url: "https://react.dev/learn/react-developer-tools",
      title: "React Developer Tools – React",
      visitCount: 5,
      lastVisitTime: Date.now() - 45 * 60 * 1000, // 45 minutes ago
      domain: "react.dev",
    },
    searchQuery: "react developer",
  },
};
