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
    isLoading: false,
    onSearch: () => {},
  },
};

export const Loading: Story = {
  args: {
    historyCount: 890,
    isLoading: true,
    onSearch: () => {},
  },
};

export const EmptyHistory: Story = {
  args: {
    historyCount: 0,
    isLoading: false,
    onSearch: () => {},
  },
};
