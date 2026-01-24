import type { Meta, StoryObj } from "@storybook/react-vite";

import { CheckBoxWithLabel } from "./index";

const meta: Meta<typeof CheckBoxWithLabel> = {
  title: "Components/CheckBoxWithLabel",
  component: CheckBoxWithLabel,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Enable this option",
    onChange: (e) => console.log("Changed to:", e.target.checked),
  },
};

export const LongLabel: Story = {
  args: {
    label:
      "This is a very long label that demonstrates how the checkbox handles lengthy text content",
    onChange: (e) => console.log("Changed to:", e.target.checked),
  },
};
