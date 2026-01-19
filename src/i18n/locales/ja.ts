import type { en } from "./en";

export const ja = {
  // App confirmation dialogs
  "app.confirmDeleteHistoryItem":
    "「{title}」を履歴から削除してもよろしいですか？",
  "app.deleteHistoryItemFailed":
    "履歴の削除に失敗しました。もう一度お試しください。",
  "app.confirmRemoveQuery": "このクエリを削除してもよろしいですか？",

  // Search box
  "searchBox.placeholder": "履歴を検索...",
  "searchBox.saveQuery": "クエリを保存",

  // History item
  "historyItem.deleteItem": "履歴を削除",
  "historyItem.openInNewTab": "新しいタブで開く",
  "historyItem.copyLink": "リンクをコピー",
  "historyItem.copyRichText": "リンクをリッチテキスト形式でコピー",

  // Saved queries
  "savedQueries.searchForQuery": "{query} で検索",
  "savedQueries.removeSavedQuery": "保存されたクエリを削除",

  // Help button
  "helpButton.openHelp": "ヘルプを開く",
  "helpButton.help": "ヘルプ",

  // Help modal
  "helpModal.howToUse": "使い方",
  "helpModal.closeModal": "モーダルを閉じる",
  "helpModal.aboutThisExtension": "Eternal Historyとは",
  "helpModal.aboutDescription":
    "Eternal Historyは、すべてのブラウザ履歴をChromeブックマークに保存することで無期限のブラウザ履歴ストレージを提供するChrome拡張機能です。さらに、新しいタブページを履歴検索画面に置き換え、訪れたことのあるページを簡単に検索・管理できるようにします。",
  "helpModal.searchSyntax": "検索クエリ構文",
  "helpModal.searchPhrase":
    "通常の検索。タイトルとURLに含まれる文字列から検索します。",
  "helpModal.searchExclude": "除外検索。指定した文字列を含む結果を除外します。",
  "helpModal.searchSite":
    "ドメイン指定検索。指定した文字列をURLに含むサイトのみを検索します。",
  "helpModal.searchMultiple":
    "クエリの組み合わせの例。それぞれの構文は組み合わせて利用が可能です。",
  "helpModal.savingQueries": "クエリの保存",
  "helpModal.savingQueriesDescription":
    "検索ボックス横の「+」ボタンをクリックすることでクエリの保存ができます。よく使うクエリを保存し、すばやくアクセスできます。",

  // Options button
  "optionsButton.openOptions": "オプションを開く",
  "optionsButton.options": "オプション",

  // Options page
  "options.title": "Eternal History オプション",
  "options.search": "検索設定",
  "options.groupByUrl": "同一URLの検索結果をまとめる",
  "options.groupByTitle": "同一タイトルの検索結果をまとめる",
  "options.save": "保存",
  "options.reset": "初期設定に戻す",
  "options.saved": "設定を保存しました！",
} as const satisfies Record<keyof typeof en, string>;
