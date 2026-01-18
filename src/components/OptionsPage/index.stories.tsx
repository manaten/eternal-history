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
    onThemeChange: (theme) => console.log("Theme changed:", theme),
    onResultsPerPageChange: (value) =>
      console.log("Results per page changed:", value),
    onHighlightMatchesChange: (value) =>
      console.log("Highlight matches changed:", value),
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

export const LightTheme: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: "light",
    },
  },
};

export const DarkTheme: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: "dark",
    },
  },
};

export const CustomSearchSettings: Story = {
  args: {
    ...Default.args,
    settings: {
      ...DEFAULT_SETTINGS,
      search: {
        resultsPerPage: 500,
        highlightMatches: false,
      },
    },
  },
};
