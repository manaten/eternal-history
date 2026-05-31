---
name: pure-components
description: Keep React components in this project pure — side effects must be injected via props from App.tsx / OptionsApp.tsx, not imported directly into components. Storybook stories pass mock implementations. The boundary of "side effect" is fuzzy (network calls and storage I/O are clearly out; browser API usage is case-by-case) — when unclear, ASK the owner before deciding. Triggers when adding/modifying components under src/components/ that need side effects.
---

# Pure Components

このプロジェクトの規約: **`src/components/` 配下の React コンポーネントは
副作用を抱えない**。副作用は `App.tsx` / `OptionsApp.tsx` で wire し、
コンポーネントには callback prop として渡す。

これは Storybook を成立させるためだけではなく、コンポーネントの責務を
「表示と入力ハンドリング」に絞り、副作用のテスト (とモック) を上位レイヤに
集約するための一般的な設計規約。

## やってはいけないこと

`src/components/` 配下のファイルで副作用を直接 import / 呼び出してはいけない:

```ts
// ❌ NG
import { bookmarkHistoryStore } from "../../../infra/bookmark-history-store";
import { requestSuggestions } from "../../../infra/word-index-client";
chrome.runtime.sendMessage(...)
chrome.storage.local.get(...)
chrome.bookmarks.search(...)
fetch(...)
localStorage.setItem(...)
```

## やるべきこと

副作用は callback prop として受け取る:

```tsx
// ✅ OK (component)
interface SearchBoxProps {
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

## 副作用の境界が曖昧なケース

「副作用」の定義は項目によって白黒つかない:

- **明らかに副作用 (注入必須)**: ネットワーク (`fetch`, `chrome.runtime.sendMessage`)、
  永続化 (`chrome.storage.*`, `localStorage`, IndexedDB)、ブラウザ履歴/ブックマーク
  API (`chrome.history.*`, `chrome.bookmarks.*`)
- **微妙**: `window.location` 読み取り、`navigator.clipboard.*`、`document.title` の
  読み書き、`window.open`、`chrome.runtime.openOptionsPage` など

**迷ったら都度オーナーに確認する**。「コンポーネントに含めて良いか?」を聞いてから
進める。勝手に判断して副作用を埋め込まない。

## Storybook 設定で副作用をスタブしない

`.storybook/preview.tsx` で `globalThis.chrome = { ... }` のような stub を入れて
コンポーネントを動かすのは **アンチパターン**。コンポーネントを修正して props で
副作用を受けるようにすること。

## チェック方法

```sh
grep -rn "chrome\.runtime\|chrome\.bookmarks\|chrome\.history\|chrome\.storage\|fetch(" src/components/
```

ヒットがあれば、原則として注入に直すか、迷う場合はオーナーに確認する。
