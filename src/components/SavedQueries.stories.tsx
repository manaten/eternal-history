import type { Meta, StoryObj } from "@storybook/react-vite";

import { SavedQueries } from "./SavedQueries";

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

export const Default: Story = {
  args: {
    queries: [
      { id: "1", query: "react", createdAt: Date.now() - 1000 },
      { id: "2", query: "typescript", createdAt: Date.now() - 2000 },
      { id: "3", query: "storybook", createdAt: Date.now() - 3000 },
    ],
  },
};

export const SingleQuery: Story = {
  args: {
    queries: [{ id: "1", query: "react hooks", createdAt: Date.now() }],
  },
};

export const ManyQueries: Story = {
  args: {
    queries: [
      { id: "1", query: "react", createdAt: Date.now() - 1000 },
      { id: "2", query: "typescript", createdAt: Date.now() - 2000 },
      { id: "3", query: "storybook", createdAt: Date.now() - 3000 },
      { id: "4", query: "chrome extension", createdAt: Date.now() - 4000 },
      { id: "5", query: "history api", createdAt: Date.now() - 5000 },
      { id: "6", query: "bookmark management", createdAt: Date.now() - 6000 },
    ],
  },
};

export const LongQueries: Story = {
  args: {
    queries: [
      {
        id: "1",
        query: "very long search query that might overflow",
        createdAt: Date.now() - 1000,
      },
      {
        id: "2",
        query: "another extremely long query text that should be truncated",
        createdAt: Date.now() - 2000,
      },
      { id: "3", query: "short", createdAt: Date.now() - 3000 },
    ],
  },
};

export const Empty: Story = {
  args: {
    queries: [],
  },
};
