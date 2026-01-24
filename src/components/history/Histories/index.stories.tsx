import type { Meta, StoryObj } from "@storybook/react-vite";

import { Histories } from "./index";
import type { HistoryItem } from "../../../types/HistoryItem";

const meta: Meta<typeof Histories> = {
  component: Histories,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// VRT（Visual Regression Testing）用の固定日付
// 2024年1月15日 12:00:00 (JST)
const FIXED_DATE = new Date(2024, 0, 15, 12, 0, 0).getTime();

const mockHistoryItems: HistoryItem[] = [
  {
    id: "1",
    url: "https://react.dev",
    title: "React - The library for web and native user interfaces",
    visitCount: 15,
    lastVisitTime: FIXED_DATE - 1 * 60 * 60 * 1000, // 1 hour ago
    domain: "react.dev",
  },
  {
    id: "2",
    url: "https://github.com/facebook/react",
    title: "GitHub - facebook/react",
    visitCount: 8,
    lastVisitTime: FIXED_DATE - 2 * 60 * 60 * 1000, // 2 hours ago
    domain: "github.com",
  },
  {
    id: "3",
    url: "https://stackoverflow.com/questions/tagged/react",
    title: "Newest Questions - Stack Overflow",
    visitCount: 3,
    lastVisitTime: FIXED_DATE - 25 * 60 * 60 * 1000, // Yesterday
    domain: "stackoverflow.com",
  },
  {
    id: "4",
    url: "https://www.typescriptlang.org/",
    title: "TypeScript: JavaScript With Syntax For Types",
    visitCount: 5,
    lastVisitTime: FIXED_DATE - 25 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000, // Yesterday, different time
    domain: "typescriptlang.org",
  },
];

export const Default: Story = {
  args: {
    history: mockHistoryItems,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    history: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    history: [],
    isLoading: false,
  },
};

export const SingleDay: Story = {
  args: {
    history: mockHistoryItems.slice(0, 2), // Only today's items
    isLoading: false,
  },
};

export const LargeDataset: Story = {
  args: {
    history: Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      url: `https://example-${i}.com`,
      title: `Example Website ${i + 1} - Some interesting content here`,
      visitCount: (i % 20) + 1, // Deterministic visit count
      lastVisitTime: FIXED_DATE - i * 2 * 60 * 60 * 1000, // Each item 2 hours apart
      domain: `example-${i}.com`,
    })),
    isLoading: false,
  },
};
