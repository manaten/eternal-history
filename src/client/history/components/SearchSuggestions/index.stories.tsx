import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchSuggestions } from ".";

const meta: Meta<typeof SearchSuggestions> = {
  component: SearchSuggestions,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  // SearchSuggestions は `absolute inset-x-0 top-full` で親に対して相対位置を取るので、
  // 表示のためにある程度の幅を持つ relative な親で囲む。
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: 480,
          // dropdown が top-full で出るので、親に高さを持たせて余白を確保
          paddingTop: 16,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_SUGGESTIONS = [
  "GitHub",
  "GitLab",
  "Gist",
  "GitHub Pages",
  "GitKraken",
];

export const Default: Story = {
  args: {
    suggestions: SAMPLE_SUGGESTIONS,
    selectedIndex: -1,
  },
};

export const ItemSelected: Story = {
  args: {
    suggestions: SAMPLE_SUGGESTIONS,
    selectedIndex: 1,
  },
};

export const SingleSuggestion: Story = {
  args: {
    suggestions: ["GitHub"],
    selectedIndex: 0,
  },
};

export const Japanese: Story = {
  args: {
    suggestions: ["東京", "東京タワー", "東京駅"],
    selectedIndex: 0,
  },
};

export const ManySuggestionsScrolls: Story = {
  args: {
    suggestions: Array.from({ length: 20 }, (_, i) => `suggestion-${i + 1}`),
    selectedIndex: 0,
  },
};

// suggestions が空のときは null を返して何も描画しないことの確認 (ストーリーは空表示)
export const Empty: Story = {
  args: {
    suggestions: [],
    selectedIndex: -1,
  },
};
