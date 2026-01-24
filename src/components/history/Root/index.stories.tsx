import type { Meta, StoryObj } from "@storybook/react-vite";

import { Root } from "./index";
import type { HistoryItem } from "../../../types/HistoryItem";

const meta: Meta<typeof Root> = {
  component: Root,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    onSearch: { action: "search executed" },
  },
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
    lastVisitTime: FIXED_DATE - 1 * 60 * 60 * 1000,
    domain: "react.dev",
  },
  {
    id: "2",
    url: "https://github.com/facebook/react",
    title: "GitHub - facebook/react",
    visitCount: 8,
    lastVisitTime: FIXED_DATE - 2 * 60 * 60 * 1000,
    domain: "github.com",
  },
  {
    id: "3",
    url: "https://stackoverflow.com/questions/tagged/react",
    title: "Newest Questions - Stack Overflow",
    visitCount: 3,
    lastVisitTime: FIXED_DATE - 25 * 60 * 60 * 1000,
    domain: "stackoverflow.com",
  },
];

export const Default: Story = {
  args: {
    history: mockHistoryItems,
    searchQuery: "",
    isLoading: false,
    savedQueries: [],
  },
};

export const Loading: Story = {
  args: {
    history: [],
    searchQuery: "",
    isLoading: true,
    savedQueries: [],
  },
};

export const Empty: Story = {
  args: {
    history: [],
    searchQuery: "",
    isLoading: false,
    savedQueries: [],
  },
};

export const WithSavedQueries: Story = {
  args: {
    history: mockHistoryItems,
    searchQuery: "",
    isLoading: false,
    savedQueries: [
      { id: "1", query: "react", createdAt: 0 },
      { id: "2", query: "storybook", createdAt: 0 },
    ],
  },
};
