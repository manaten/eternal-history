import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { OptionsPage } from "./index";
import { DEFAULT_SETTINGS } from "../../../lib/settings";

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
    onSave: fn(),
    onReset: fn().mockResolvedValue(DEFAULT_SETTINGS),
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    initialSettings: undefined,
  },
};
