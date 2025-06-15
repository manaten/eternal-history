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
