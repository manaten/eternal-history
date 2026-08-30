import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ThemeSelector } from "./index";

const meta: Meta<typeof ThemeSelector> = {
  component: ThemeSelector,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    radioProps: {
      name: "theme",
      onChange: fn(),
    },
  },
};

export const Checked: Story = {
  args: {
    radioProps: {
      name: "theme",
      onChange: fn(),
      defaultChecked: true,
      defaultValue: "emerald",
    },
  },
};
