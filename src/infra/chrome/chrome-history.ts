import { HistoryItem } from "../../domain/history/types";

/**
 * Chrome 標準の履歴 API への薄いラッパ。
 * `chrome.history.*` を直接呼ぶのはこのモジュールだけ。
 */

function chromeHistoryToHistoryItem(
  historyItem: chrome.history.HistoryItem,
): HistoryItem {
  return {
    id: historyItem.id || "",
    url: historyItem.url ?? "",
    title: historyItem.title ?? "",
    visitCount: historyItem.visitCount ?? 0,
    lastVisitTime: historyItem.lastVisitTime ?? 0,
    domain: new URL(historyItem.url || "").hostname,
  };
}

export async function deleteUrlFromBrowserHistory(url: string): Promise<void> {
  await chrome.history.deleteUrl({ url });
}

/**
 * ブラウザに蓄積された全履歴を取得します。
 * Chrome の chrome.history.search に maxResults の上限があるため、
 * 実用上 999999 を上限として全件扱いします。
 */
export async function getAllBrowserHistory(): Promise<HistoryItem[]> {
  const items = await chrome.history.search({
    text: "",
    startTime: 0,
    maxResults: 999999,
  });
  return items.map(chromeHistoryToHistoryItem);
}

/**
 * URL に対する最新の履歴エントリを 1 件取得します。
 * onVisited 直後だとタイトルが未確定のことがあるため、遅延後に呼び直す用途で利用します。
 */
export async function getLatestHistoryByUrl(
  url: string,
): Promise<HistoryItem | null> {
  const results = await chrome.history.search({ text: url, maxResults: 1 });
  return results[0] ? chromeHistoryToHistoryItem(results[0]) : null;
}

/**
 * 新規 visit イベントを購読します。
 * Chrome 由来の型を HistoryItem に詰め替えてからコールバックに渡します。
 */
export function onHistoryVisited(
  callback: (item: HistoryItem) => void | Promise<void>,
): void {
  chrome.history.onVisited.addListener((historyItem) => {
    void callback(chromeHistoryToHistoryItem(historyItem));
  });
}
