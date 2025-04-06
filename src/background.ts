chrome.history.onVisited.addListener((historyItem) => {
  console.log("訪問した履歴:", historyItem);
  // SQLiteに保存とかやる処理を書くのだ
});
