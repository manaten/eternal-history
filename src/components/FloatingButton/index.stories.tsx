import type { Meta, StoryObj } from "@storybook/react-vite";

import { FloatingButton } from "./index";

const meta: Meta<typeof FloatingButton> = {
  title: "Components/FloatingButton",
  component: FloatingButton,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Help: Story = {
  args: {
    icon: "help",
    onClick: () => console.log("Help button clicked"),
    "aria-label": "Open help",
    title: "Help",
    className: "bottom-4 md:bottom-6",
  },
};

export const Options: Story = {
  args: {
    icon: "options",
    onClick: () => console.log("Options button clicked"),
    "aria-label": "Open options",
    title: "Options",
    className: "bottom-20 md:bottom-[104px]",
  },
};
