import type { Meta, StoryObj } from "@storybook/react-vite";

import { HelpButton } from "./HelpButton";

const meta: Meta<typeof HelpButton> = {
  title: "Components/HelpButton",
  component: HelpButton,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: () => console.log("Help button clicked"),
  },
};
