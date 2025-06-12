import { initializeStorage, insertHistories } from "./lib/storage";
import { HistoryItem } from "./types/HistoryItem";

async function initialize() {
  await initializeStorage();

  const currentHistory = await chrome.history.search({
    text: "", // 空文字で全件取得対象
    startTime: 0, // 1970年から現在まで全部
    maxResults: 999999, // 上限を必要なだけ大きくする
  });

  console.log("current history:", currentHistory.length);

  await insertHistories(
    currentHistory.map(
      (historyItem): HistoryItem => ({
        id: historyItem.id || "",
        url: historyItem.url ?? "",
        title: historyItem.title ?? "",
        visitCount: historyItem.visitCount ?? 0,
        lastVisitTime: historyItem.lastVisitTime ?? 0,
        domain: new URL(historyItem.url || "").hostname,
      }),
    ),
  );
  console.log("inserted histories:", currentHistory.length);

  chrome.history.onVisited.addListener(async (historyItem) => {
    console.log("add new history:", historyItem);
    await insertHistories([
      {
        id: historyItem.id || "",
        url: historyItem.url ?? "",
        title: historyItem.title ?? "",
        visitCount: historyItem.visitCount ?? 0,
        lastVisitTime: historyItem.lastVisitTime ?? 0,
        domain: new URL(historyItem.url || "").hostname,
      },
    ]);
  });
}

initialize().catch((e) => {
  console.error("Failed to initialize:", e);
});
