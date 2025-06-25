import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const Medium: Story = {
  args: {
    size: "medium",
  },
};

export const Large: Story = {
  args: {
    size: "large",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size='small' />
        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Small</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size='medium' />
        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Medium</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size='large' />
        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Large</div>
      </div>
    </div>
  ),
};
