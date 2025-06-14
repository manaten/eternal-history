import { initializeStorage, insertHistories } from "./lib/storage";
import { HistoryItem } from "./types/HistoryItem";

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

async function initialize() {
  await initializeStorage();

  const currentHistory = await chrome.history.search({
    text: "", // 空文字で全件取得対象
    startTime: 0, // 1970年から現在まで全部
    maxResults: 999999, // 上限を必要なだけ大きくする
  });

  console.log("current history:", currentHistory.length);

  await insertHistories(...currentHistory.map(chromeHistoryToHistoryItem));
  console.log("inserted histories:", currentHistory.length);

  chrome.history.onVisited.addListener(async (historyItem) => {
    console.log("add new history:", historyItem);

    // 即座に保存
    await insertHistories(chromeHistoryToHistoryItem(historyItem));

    // JSでタイトルが設定される可能性がらうた目、3秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updatedHistory = await chrome.history.search({
          text: historyItem.url || "",
          maxResults: 1,
        });

        if (updatedHistory[0]) {
          const updated = updatedHistory[0];
          // タイトルが更新されている場合のみ再保存
          if (updated.title && updated.title !== historyItem.title) {
            console.log(
              `Updating title for: ${updated.url} from: ${historyItem.title} to: ${updated.title}`,
            );
            await insertHistories(chromeHistoryToHistoryItem(updated));
          }
        }
      } catch (error) {
        console.warn("Failed to update history title:", error);
      }
    }, 3000);
  });
}

initialize().catch((e) => {
  console.error("Failed to initialize:", e);
});
