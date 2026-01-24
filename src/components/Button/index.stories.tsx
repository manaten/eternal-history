import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./index";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Save",
    onClick: () => console.log("Primary button clicked"),
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Reset",
    onClick: () => console.log("Secondary button clicked"),
  },
};

export const PrimaryDisabled: Story = {
  args: {
    variant: "primary",
    children: "Save",
    disabled: true,
  },
};

export const SecondaryDisabled: Story = {
  args: {
    variant: "secondary",
    children: "Reset",
    disabled: true,
  },
};

export const LongText: Story = {
  args: {
    variant: "primary",
    children: "Save All Changes to Database",
    onClick: () => console.log("Long text button clicked"),
  },
};
