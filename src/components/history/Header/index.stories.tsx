import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./index";

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
    isLoading: false,
    savedQueries: [],
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    savedQueries: [],
  },
};

export const WithSavedQueries: Story = {
  args: {
    isLoading: false,
    savedQueries: [
      { id: "1", query: "query1", createdAt: 0 },
      { id: "2", query: "query2", createdAt: 0 },
    ],
  },
};

export const WithInitialQuery: Story = {
  args: {
    isLoading: false,
    savedQueries: [],
    initialQuery: "query1",
  },
};
