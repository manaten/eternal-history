import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import {
  getAllBrowserHistory,
  getLatestHistoryByUrl,
  onHistoryVisited,
} from "./infra/chrome/chrome-history";

async function initialize() {
  await bookmarkHistoryStore.initialize();

  const currentHistory = await getAllBrowserHistory();
  console.log("current history:", currentHistory.length);

  await bookmarkHistoryStore.insert(currentHistory);
  console.log("inserted histories:", currentHistory.length);

  onHistoryVisited(async (item) => {
    console.log("add new history:", item);

    // 即座に保存
    await bookmarkHistoryStore.insert([item]);

    // JS でタイトルが設定される可能性があるため、10 秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updated = await getLatestHistoryByUrl(item.url);
        if (updated?.title && updated.title !== item.title) {
          console.log(
            `Updating title for: ${updated.url} from: ${item.title} to: ${updated.title}`,
          );
          await bookmarkHistoryStore.insert([updated]);
        }
      } catch (error) {
        console.warn("Failed to update history title:", error);
      }
    }, 1000 * 10);
  });
}

initialize().catch((e) => {
  console.error("Failed to initialize:", e);
});
