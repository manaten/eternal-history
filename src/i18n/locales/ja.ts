import type { en } from "./en";

export const ja = {
  // App confirmation dialogs
  "app.confirmDeleteHistoryItem":
    "「{title}」を履歴から削除してもよろしいですか？",
  "app.deleteHistoryItemFailed":
    "履歴の削除に失敗しました。もう一度お試しください。",
  "app.confirmRemoveQuery": "このクエリを削除してもよろしいですか？",

  // Search box
  searchPlaceholder: "履歴を検索...",
  saveQuery: "クエリを保存",

  // History item
  deleteItem: "履歴を削除",

  // Saved queries
  searchForQuery: "{query} で検索",
  removeSavedQuery: "保存されたクエリを削除",

  // Help button
  openHelp: "ヘルプを開く",
  help: "ヘルプ",

  // Help modal
  howToUse: "使い方",
  closeModal: "モーダルを閉じる",
  aboutThisExtension: "Eternal Historyとは",
  aboutDescription:
    "Eternal Historyは、すべてのブラウザ履歴をChromeブックマークに保存することで無期限のブラウザ履歴ストレージを提供するChrome拡張機能です。さらに、新しいタブページを履歴検索画面に置き換え、訪れたことのあるページを簡単に検索・管理できるようにします。",
  searchSyntax: "検索クエリ構文",
  searchPhrase: "通常の検索。タイトルとURLに含まれる文字列から検索します。",
  searchExclude: "除外検索。指定した文字列を含む結果を除外します。",
  searchSite:
    "ドメイン指定検索。指定した文字列をURLに含むサイトのみを検索します。",
  searchMultiple:
    "クエリの組み合わせの例。それぞれの構文は組み合わせて利用が可能です。",
  savingQueries: "クエリの保存",
  savingQueriesDescription:
    "検索ボックス横の「+」ボタンをクリックすることでクエリの保存ができます。よく使うクエリを保存し、すばやくアクセスできます。",
} as const satisfies Record<keyof typeof en, string>;
