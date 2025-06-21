import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentProps } from "react";
import { useArgs } from "storybook/internal/preview-api";

import { Dropdown } from "./Dropdown";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      const [args, updateArgs] = useArgs<ComponentProps<typeof Dropdown>>();

      return (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => updateArgs({ isOpen: !args.isOpen })}
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {args.isOpen ? "Close Menu" : "Open Menu"}
          </button>
          <Story
            args={{ ...args, onClose: () => updateArgs({ isOpen: false }) }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Copy", onClick: () => alert("Copy clicked") },
      { label: "Delete", onClick: () => alert("Delete clicked") },
    ],
    isOpen: true,
  },
};

export const WithDisabledItems: Story = {
  args: {
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Copy", onClick: () => alert("Copy clicked"), disabled: true },
      {
        label: "Delete",
        onClick: () => alert("Delete clicked"),
        disabled: true,
      },
    ],
    isOpen: true,
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: "Delete item", onClick: () => alert("Delete clicked") }],
    isOpen: true,
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Duplicate", onClick: () => alert("Duplicate clicked") },
      { label: "Copy Link", onClick: () => alert("Copy Link clicked") },
      { label: "Move to Folder", onClick: () => alert("Move clicked") },
      { label: "Add to Favorites", onClick: () => alert("Favorites clicked") },
      { label: "Export", onClick: () => alert("Export clicked") },
      { label: "Properties", onClick: () => alert("Properties clicked") },
      { label: "Delete", onClick: () => alert("Delete clicked") },
    ],
    isOpen: true,
  },
};

export const PositionedTopRight: Story = {
  args: {
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Delete", onClick: () => alert("Delete clicked") },
    ],
    isOpen: true,
    className: "positioned-top-right",
  },
  decorators: [
    (Story) => (
      <>
        <style>
          {`
            .positioned-top-right {
              top: -2rem;
              right: 0;
            }
          `}
        </style>
        <div style={{ textAlign: "right" }}>
          <Story />
        </div>
      </>
    ),
  ],
};

export const PositionedBottomLeft: Story = {
  args: {
    items: [
      { label: "Option 1", onClick: () => alert("Option 1 clicked") },
      { label: "Option 2", onClick: () => alert("Option 2 clicked") },
    ],
    isOpen: true,
    className: "positioned-bottom-left",
  },
  decorators: [
    (Story) => (
      <>
        <style>
          {`
            .positioned-bottom-left {
              bottom: 100%;
              left: 0;
              margin-bottom: 0.5rem;
            }
          `}
        </style>
        <Story />
      </>
    ),
  ],
};
