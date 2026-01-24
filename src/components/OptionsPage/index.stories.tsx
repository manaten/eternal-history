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
    initialSettings: DEFAULT_SETTINGS,
    isLoading: false,
    onSave: async (settings) => {
      console.log("Save clicked with settings:", settings);
    },
    onReset: async () => {
      console.log("Reset clicked");
      return DEFAULT_SETTINGS;
    },
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const GroupByUrlEnabled: Story = {
  args: {
    ...Default.args,
    initialSettings: {
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
    initialSettings: {
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
    initialSettings: {
      ...DEFAULT_SETTINGS,
      search: {
        groupByUrl: true,
        groupByTitle: true,
      },
    },
  },
};
