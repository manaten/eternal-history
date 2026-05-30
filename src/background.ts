import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import {
  getAllBrowserHistory,
  getLatestHistoryByUrl,
  onHistoryVisited,
} from "./infra/chrome/chrome-history";
import { initWordIndexService } from "./infra/word-index-service";

/**
 * WordIndex サービスはモジュール読み込み時 (= SW wake 時) に登録される。
 * メッセージリスナーの同期登録が必要なため、await の前に呼ぶ。
 */
const wordIndexService = initWordIndexService({
  getSourceTexts: async () => {
    await bookmarkHistoryStore.initialize();
    const items = await bookmarkHistoryStore.getAll();
    return items.map((it) => it.title);
  },
});

async function initialize() {
  await bookmarkHistoryStore.initialize();

  const currentHistory = await getAllBrowserHistory();
  console.log("current history:", currentHistory.length);

  await bookmarkHistoryStore.insert(currentHistory);
  console.log("inserted histories:", currentHistory.length);

  onHistoryVisited(async (item) => {
    console.log("add new history:", item);

    await bookmarkHistoryStore.insert([item]);
    wordIndexService.addVisit(item.title);

    // JS でタイトルが設定される可能性があるため、10 秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updated = await getLatestHistoryByUrl(item.url);
        if (updated?.title && updated.title !== item.title) {
          console.log(
            `Updating title for: ${updated.url} from: ${item.title} to: ${updated.title}`,
          );
          await bookmarkHistoryStore.insert([updated]);
          wordIndexService.addVisit(updated.title);
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
