import type { en } from "./en";

export const ja = {
  // App confirmation dialogs
  "app.confirmDeleteHistoryItem": "「{title}」を削除してもよろしいですか？",
  "app.deleteHistoryItemFailed":
    "履歴アイテムの削除に失敗しました。もう一度お試しください。",
  "app.confirmRemoveQuery": "このクエリを削除してもよろしいですか？",

  // Search box
  searchPlaceholder: "履歴を検索...",
  saveQuery: "クエリを保存",

  // History item
  deleteItem: "アイテムを削除",

  // Saved queries
  searchForQuery: "検索: {query}",
  removeSavedQuery: "保存されたクエリを削除",

  // Help button
  openHelp: "ヘルプを開く",
  help: "ヘルプ",

  // Help modal
  howToUse: "使い方",
  closeModal: "モーダルを閉じる",
  aboutThisExtension: "この拡張機能について",
  aboutDescription:
    "Eternal Historyは、履歴データをChromeブックマークに階層フォルダ構造でシリアル化することで、無制限のブラウザ履歴ストレージを提供するChrome拡張機能です。この拡張機能は新しいタブページを検索可能な履歴インターフェースに置き換え、ブラウジング履歴を簡単に検索・管理できるようにします。",
  searchSyntax: "検索構文",
  searchSyntaxDescription:
    "以下の検索演算子を使用して結果を絞り込むことができます：",
  searchExactPhrase: "完全一致検索（クォートを使用）",
  searchExactPhraseExample: '"完全一致フレーズ"',
  searchExclude: "除外検索（マイナス記号を使用）",
  searchExcludeExample: "-除外したい語",
  searchSite: "特定サイト内検索",
  searchSiteExample: "site:example.com",
  searchMultiple: "複数の演算子の組み合わせ",
  searchMultipleExample: '"重要な文書" -下書き site:company.com',
  savingQueries: "クエリの保存",
  savingQueriesDescription:
    "検索ボックス横の「+」ボタンをクリックして、よく使うクエリを保存してすばやくアクセスできます。",
} as const satisfies Record<keyof typeof en, string>;
