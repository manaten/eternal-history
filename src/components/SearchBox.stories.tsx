import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchBox } from "./SearchBox";

const meta: Meta<typeof SearchBox> = {
  title: "Components/SearchBox",
  component: SearchBox,
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
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const WithQuery: Story = {
  args: {
    searchQuery: "React components tutorial",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const Loading: Story = {
  args: {
    searchQuery: "Searching...",
    isLoading: true,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const LongQuery: Story = {
  args: {
    searchQuery:
      "This is a very long search query that might overflow the input field to test how it handles long text",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
};

export const EmptyFocused: Story = {
  args: {
    searchQuery: "",
    isLoading: false,
    onSearchQueryChange: () => {},
    onSearch: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Empty search box that should auto-focus when rendered",
      },
    },
  },
};
