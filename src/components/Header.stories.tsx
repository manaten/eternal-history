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
    isLoading: false,
    onSearch: () => {},
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    onSearch: () => {},
  },
};
