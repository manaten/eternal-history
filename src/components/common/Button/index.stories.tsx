import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "./index";

const meta: Meta<typeof Button> = {
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
    onClick: fn(),
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Reset",
    onClick: fn(),
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
    onClick: fn(),
  },
};
