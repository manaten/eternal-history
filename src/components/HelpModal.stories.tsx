import type { Meta, StoryObj } from "@storybook/react-vite";

import { HelpModal } from "./HelpModal";

const meta: Meta<typeof HelpModal> = {
  title: "Components/HelpModal",
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
    onClose: () => console.log("Modal closed"),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log("Modal closed"),
  },
};
