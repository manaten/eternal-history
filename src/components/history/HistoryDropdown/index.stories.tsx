import type { Meta, StoryObj } from "@storybook/react-vite";

import { HistoryDropdown } from "./index";
import { HistoryItem } from "../../../types/HistoryItem";

const meta: Meta<typeof HistoryDropdown> = {
  title: "Components/HistoryDropdown",
  component: HistoryDropdown,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockHistoryItem: HistoryItem = {
  id: "123",
  url: "https://www.example.com/page",
  domain: "www.example.com",
  title: "Example Page Title",
  lastVisitTime: new Date("2025-01-15T10:30:00Z").getTime(),
  visitCount: 5,
};

export const Default: Story = {
  args: {
    item: mockHistoryItem,
    position: { x: 100, y: 100 },
    onDelete: (item) => alert(`Delete requested for: ${item.title}`),
  },
};
