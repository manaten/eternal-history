import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    historyCount: 1234,
    searchQuery: "",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const WithSearchQuery: Story = {
  args: {
    historyCount: 567,
    searchQuery: "React components",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const Loading: Story = {
  args: {
    historyCount: 890,
    searchQuery: "Loading state",
    isLoading: true,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const EmptyHistory: Story = {
  args: {
    historyCount: 0,
    searchQuery: "",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const LargeCount: Story = {
  args: {
    historyCount: 99999,
    searchQuery: "",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};
