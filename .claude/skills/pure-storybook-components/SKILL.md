---
name: pure-storybook-components
description: Keep React components pure for Storybook. All side effects (chrome.* APIs, network calls, storage I/O) must be injected via props from App.tsx / OptionsApp.tsx, not imported directly into components. Storybook stories pass mock implementations. Triggers when adding/modifying components under src/components/ that need side effects.
---

# Pure Storybook Components

このプロジェクトでは **React コンポーネントは純粋** に保ち、副作用は `App.tsx` /
`OptionsApp.tsx` で注入する規約を採用している。これにより:

- Storybook ストーリーがそのまま動く (`chrome` グローバル不要)
- 副作用のテストが上位レイヤに集約される
- コンポーネントの責務が「表示と入力ハンドリング」に絞られる

## やってはいけないこと

`src/components/` 配下のファイルで以下を直接 import / 呼び出してはいけない:

```ts
// ❌ NG
import { bookmarkHistoryStore } from "../../../infra/bookmark-history-store";
import { requestSuggestions } from "../../../infra/word-index-client";
chrome.runtime.sendMessage(...)
chrome.storage.local.get(...)
chrome.bookmarks.search(...)
chrome.history.search(...)
```

## やるべきこと

副作用は callback prop として受け取る:

```tsx
// ✅ OK
interface MyComponentProps {
  onRequestSuggestions: (query: string, limit: number) => Promise<readonly string[]>;
  onSave: (data: Foo) => Promise<void>;
}
```

`App.tsx` / `OptionsApp.tsx` で実体を wire する:

```tsx
// ✅ OK (top-level)
import { requestSuggestions } from "./infra/word-index-client";

function App() {
  return <Root onRequestSuggestions={requestSuggestions} ... />;
}
```

Storybook ストーリーではモックを渡す:

```tsx
// ✅ OK (story)
export const Default: Story = {
  args: {
    onRequestSuggestions: async () => ["GitHub", "GitLab"],
  },
};
```

## Storybook 設定で副作用をスタブしない

`.storybook/preview.tsx` で `globalThis.chrome = { ... }` のような stub を入れて
コンポーネントを動かすのは **アンチパターン**。コンポーネントを修正して props で
副作用を受けるようにすること。

## チェック方法

```sh
grep -rn "chrome\.runtime\|chrome\.bookmarks\|chrome\.history\|chrome\.storage" src/components/
```

何もヒットしないのが正しい状態。
