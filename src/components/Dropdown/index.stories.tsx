import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Dropdown } from "./index";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story, { args }) => {
      const [isOpen, setOpen] = useState(true);

      const buttonStyles = {
        padding: "0.5rem 1rem",
        background: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      } as const as React.CSSProperties;

      return (
        <div style={{ position: "relative" }}>
          <style>
            {`
              .positioned-top-left {
                top: 2.25rem;
                left: 0;
              }
            `}
          </style>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            style={buttonStyles}
          >
            Open Menu
          </button>
          <Story args={{ ...args, isOpen, onClose: () => setOpen(false) }} />
          <div title={`dropdown-${isOpen}`} />
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
    className: "positioned-top-left",
  },
};

export const WithDisabledItems: Story = {
  args: {
    ...Default.args,
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Copy", onClick: () => alert("Copy clicked"), disabled: true },
      {
        label: "Delete",
        onClick: () => alert("Delete clicked"),
        disabled: true,
      },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    ...Default.args,
    items: [{ label: "Delete item", onClick: () => alert("Delete clicked") }],
  },
};

export const ManyItems: Story = {
  args: {
    ...Default.args,
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
  },
};

export const PositionedTopRight: Story = {
  args: {
    ...Default.args,
    items: [
      { label: "Edit", onClick: () => alert("Edit clicked") },
      { label: "Delete", onClick: () => alert("Delete clicked") },
    ],
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
    ...Default.args,
    items: [
      { label: "Option 1", onClick: () => alert("Option 1 clicked") },
      { label: "Option 2", onClick: () => alert("Option 2 clicked") },
    ],
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

export const OpenOnClick: Story = {
  ...Default,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(document.body);
    await canvas.findByTitle("dropdown-false");
    await expect(canvas.queryByRole("menu")).toBeNull();

    await userEvent.click(canvas.getByText("Open Menu"));
    await expect(await canvas.findByRole("menu")).toBeVisible();
  },
};

export const CloseOnClickOutside: Story = {
  ...Default,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Open Menu"));
    await expect(await canvas.findByRole("menu")).toBeVisible();

    await userEvent.click(document.body);
    await canvas.findByTitle("dropdown-false");
    await expect(canvas.queryByRole("menu")).toBeNull();
  },
};
