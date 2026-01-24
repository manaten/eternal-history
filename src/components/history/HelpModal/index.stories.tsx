import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { HelpModal } from "./index";

const meta: Meta<typeof HelpModal> = {
  component: HelpModal,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
};
