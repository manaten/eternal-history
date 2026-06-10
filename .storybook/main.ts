import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // 拡張本体側で `vite.config.ts` の `define` 経由で注入している `__DEV_BUILD__` を
  // Storybook の vite にも伝える。これが無いと OptionsPage の `__DEV_BUILD__` 参照が
  // ReferenceError になる。
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        __DEV_BUILD__: JSON.stringify(false),
      },
    };
  },
};
export default config;
