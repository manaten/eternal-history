import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { OptionsPage } from ".";
import { DEFAULT_SETTINGS } from "../..";

const meta: Meta<typeof OptionsPage> = {
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
    onSave: fn(),
    onReset: fn().mockResolvedValue(DEFAULT_SETTINGS),
    onThemeChange: fn(),
    onRebuildIndex: fn().mockResolvedValue({
      ok: true,
      wordCount: 0,
      elapsedMs: 0,
    }),
    onGetAllHistoryItems: fn().mockResolvedValue([]),
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    initialSettings: undefined,
  },
};
