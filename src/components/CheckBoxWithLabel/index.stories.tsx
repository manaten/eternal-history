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

export const Unchecked: Story = {
  args: {
    label: "Enable this option",
    checked: false,
    onChange: (value) => console.log("Changed to:", value),
  },
};

export const Checked: Story = {
  args: {
    label: "Enable this option",
    checked: true,
    onChange: (value) => console.log("Changed to:", value),
  },
};

export const LongLabel: Story = {
  args: {
    label:
      "This is a very long label that demonstrates how the checkbox handles lengthy text content",
    checked: false,
    onChange: (value) => console.log("Changed to:", value),
  },
};
