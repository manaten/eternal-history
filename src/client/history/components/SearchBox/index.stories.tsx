import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchBox } from ".";

const meta: Meta<typeof SearchBox> = {
  component: SearchBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story 全体で使うモック。SearchBox が副作用を直接呼ばず、ここで「決定的に」
// 返す候補を渡すことで visual regression を安定させる。
const mockSuggestions = async (query: string): Promise<readonly string[]> => {
  // クエリの末尾トークンに応じて固定セットを返す。
  if (query.toLowerCase().startsWith("git")) {
    return ["GitHub", "GitLab", "Gist"];
  }
  if (query.toLowerCase().startsWith("re")) {
    return ["react", "redux", "remix"];
  }
  return [];
};

export const Default: Story = {
  args: {
    searchQuery: "",
    isLoading: false,
    onRequestSuggestions: mockSuggestions,
  },
};

export const Loading: Story = {
  args: {
    searchQuery: "",
    isLoading: true,
    onRequestSuggestions: mockSuggestions,
  },
};

export const WithQuery: Story = {
  args: {
    searchQuery: "react hooks",
    isLoading: false,
    onRequestSuggestions: mockSuggestions,
  },
};
