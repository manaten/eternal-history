import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ActionButton } from "./index";

const meta: Meta<typeof ActionButton> = {
  component: ActionButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Help: Story = {
  args: {
    icon: "help",
    onClick: fn(),
    "aria-label": "Open help",
    title: "Help",
  },
};

export const Options: Story = {
  args: {
    icon: "options",
    onClick: fn(),
    "aria-label": "Open options",
    title: "Options",
  },
};
