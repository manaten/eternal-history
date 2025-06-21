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
    searchQuery: "",
    isLoading: false,
    savedQueries: [],
    onSearch: () => {},
    onSearchQueryChange: () => {},
    onQueryRemove: () => {},
  },
};

export const Loading: Story = {
  args: {
    searchQuery: "",
    isLoading: true,
    savedQueries: [],
    onSearch: () => {},
    onSearchQueryChange: () => {},
    onQueryRemove: () => {},
  },
};

export const WithSavedQueries: Story = {
  args: {
    searchQuery: "",
    isLoading: false,
    savedQueries: [
      { id: "1", query: "query1", createdAt: 0 },
      { id: "2", query: "query2", createdAt: 0 },
    ],
    onSearch: () => {},
    onSearchQueryChange: () => {},
    onQueryRemove: () => {},
  },
};
