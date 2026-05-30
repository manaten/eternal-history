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
 *
 * onVisited からは `scheduleRebuild()` で「いつかブックマーク全件から再構築して」と
 * 依頼するだけ。差分更新は持たず、サービス内部の debounce + queue が実体ビルドを
 * 集約する (race / 二重カウントが構造的に発生しない)。
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
    wordIndexService.scheduleRebuild();

    // JS でタイトルが設定される可能性があるため、10 秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updated = await getLatestHistoryByUrl(item.url);
        if (updated?.title && updated.title !== item.title) {
          console.log(
            `Updating title for: ${updated.url} from: ${item.title} to: ${updated.title}`,
          );
          await bookmarkHistoryStore.insert([updated]);
          wordIndexService.scheduleRebuild();
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
