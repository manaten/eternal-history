import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { OptionsForm } from "./index";
import { DEFAULT_SETTINGS } from "../../../lib/settings";

const meta: Meta<typeof OptionsForm> = {
  component: OptionsForm,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialSettings: DEFAULT_SETTINGS,
    onSave: fn(),
    onReset: fn().mockResolvedValue(DEFAULT_SETTINGS),
  },
};
