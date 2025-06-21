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
  },
};

export const Loading: Story = {
  args: {
    searchQuery: "",
    isLoading: true,
  },
};

export const WithQuery: Story = {
  args: {
    searchQuery: "react hooks",
    isLoading: false,
  },
};
