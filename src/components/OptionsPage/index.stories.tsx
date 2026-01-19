import type { Meta, StoryObj } from "@storybook/react-vite";

import { OptionsPage } from "./index";
import { DEFAULT_SETTINGS } from "../../lib/settings";


const meta: Meta<typeof OptionsPage> = {
  title: "Components/OptionsPage",
  component: OptionsPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    settings: DEFAULT_SETTINGS,
    saved: false,
    isLoading: false,
    onGroupByUrlChange: (value) => console.log("Group by URL changed:", value),
    onGroupByTitleChange: (value) =>
      console.log("Group by title changed:", value),
    onSave: () => console.log("Save clicked"),
    onReset: () => console.log("Reset clicked"),
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const Saved: Story = {
  args: {
    ...Default.args,
    saved: true,
  },
};

export const GroupByUrlEnabled: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      search: {
        ...DEFAULT_SETTINGS.search,
        groupByUrl: true,
      },
    },
  },
};

export const GroupByTitleEnabled: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      search: {
        ...DEFAULT_SETTINGS.search,
        groupByTitle: true,
      },
    },
  },
};

export const BothGroupingEnabled: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      search: {
        groupByUrl: true,
        groupByTitle: true,
      },
    },
  },
};
