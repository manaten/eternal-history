import type { Meta, StoryObj } from "@storybook/react-vite";

import { HistoryItem } from "./HistoryItem";

const meta: Meta<typeof HistoryItem> = {
  title: "Components/HistoryItem",
  component: HistoryItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
