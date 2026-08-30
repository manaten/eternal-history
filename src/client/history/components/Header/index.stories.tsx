import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from ".";

const meta: Meta<typeof Header> = {
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// SearchBox に注入する副作用のモック (Header はそのまま下に流すだけ)
const mockRequestSuggestions = async (): Promise<readonly string[]> => [];

export const Default: Story = {
  args: {
    isLoading: false,
    savedQueries: [],
    onRequestSuggestions: mockRequestSuggestions,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    savedQueries: [],
    onRequestSuggestions: mockRequestSuggestions,
  },
};

export const WithSavedQueries: Story = {
  args: {
    isLoading: false,
    savedQueries: [
      { id: "1", query: "query1", createdAt: 0 },
      { id: "2", query: "query2", createdAt: 0 },
    ],
    onRequestSuggestions: mockRequestSuggestions,
  },
};

export const WithInitialQuery: Story = {
  args: {
    isLoading: false,
    savedQueries: [],
    initialQuery: "query1",
    onRequestSuggestions: mockRequestSuggestions,
  },
};
