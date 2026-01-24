import type { Meta, StoryObj } from "@storybook/react-vite";

import { SavedQueries } from "./index";

const meta: Meta<typeof SavedQueries> = {
  component: SavedQueries,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onQueryClick: { action: "query clicked" },
    onQueryRemove: { action: "query removed" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// VRT（Visual Regression Testing）用の固定日付
// 2024年1月15日 12:00:00 (JST)
const FIXED_DATE = new Date(2024, 0, 15, 12, 0, 0).getTime();

export const Default: Story = {
  args: {
    queries: [
      { id: "1", query: "react", createdAt: FIXED_DATE - 1000 },
      { id: "2", query: "typescript", createdAt: FIXED_DATE - 2000 },
      { id: "3", query: "storybook", createdAt: FIXED_DATE - 3000 },
    ],
    currentQuery: "react",
  },
};

export const SingleQuery: Story = {
  args: {
    queries: [{ id: "1", query: "react hooks", createdAt: FIXED_DATE }],
  },
};

export const ManyQueries: Story = {
  args: {
    queries: [
      { id: "1", query: "react", createdAt: FIXED_DATE - 1000 },
      { id: "2", query: "typescript", createdAt: FIXED_DATE - 2000 },
      { id: "3", query: "storybook", createdAt: FIXED_DATE - 3000 },
      { id: "4", query: "chrome extension", createdAt: FIXED_DATE - 4000 },
      { id: "5", query: "history api", createdAt: FIXED_DATE - 5000 },
      { id: "6", query: "bookmark management", createdAt: FIXED_DATE - 6000 },
    ],
    currentQuery: "react",
  },
};

export const LongQueries: Story = {
  args: {
    queries: [
      {
        id: "1",
        query: "very long search query that might overflow",
        createdAt: FIXED_DATE - 1000,
      },
      {
        id: "2",
        query: "another extremely long query text that should be truncated",
        createdAt: FIXED_DATE - 2000,
      },
      { id: "3", query: "short", createdAt: FIXED_DATE - 3000 },
    ],
  },
};

export const Empty: Story = {
  args: {
    queries: [],
  },
};

export const WithActiveQuery: Story = {
  args: {
    queries: [
      { id: "1", query: "react", createdAt: FIXED_DATE - 1000 },
      { id: "2", query: "typescript", createdAt: FIXED_DATE - 2000 },
      { id: "3", query: "storybook", createdAt: FIXED_DATE - 3000 },
    ],
    currentQuery: "typescript",
  },
};
