import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import { applyTheme } from "../src/lib/theme";
import { ThemeColor } from "../src/types/Settings";

import "../src/index.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "emerald", title: "Emerald" },
          { value: "blue", title: "Blue" },
          { value: "lime", title: "Lime" },
          { value: "red", title: "Red" },
          { value: "purple", title: "Purple" },
        ] satisfies { value: ThemeColor; title: string }[],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "emerald",
  },
  decorators: [
    (Story, context) => {
      useEffect(() => {
        applyTheme(context.globals.theme);
      }, [context.globals.theme]);
      return <Story />;
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
