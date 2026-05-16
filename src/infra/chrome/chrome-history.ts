/**
 * Chrome 標準の履歴 API への薄いラッパ。
 * `chrome.history.*` を直接呼ぶのはこのモジュールだけ。
 */
export async function deleteUrlFromBrowserHistory(url: string): Promise<void> {
  await chrome.history.deleteUrl({ url });
}
