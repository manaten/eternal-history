import type { Meta, StoryObj } from "@storybook/react-vite";

import { OptionsForm } from "./index";
import { DEFAULT_SETTINGS } from "../../lib/settings";

const meta: Meta<typeof OptionsForm> = {
  title: "Components/OptionsForm",
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
    onSave: async (settings) => {
      console.log("Save clicked with settings:", settings);
    },
    onReset: async () => {
      console.log("Reset clicked");
      return DEFAULT_SETTINGS;
    },
  },
};
