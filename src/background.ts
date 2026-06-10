import { createWordIndexService } from "./domain/word-index/service";
import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import {
  getAllBrowserHistory,
  getLatestHistoryByUrl,
  onHistoryVisited,
} from "./infra/chrome/chrome-history";
import {
  loadWordIndexCache,
  saveWordIndexCache,
} from "./infra/word-index-cache";
import { makeWordIndexMessageListener } from "./infra/word-index-messaging";

/**
 * WordIndex サービスはモジュール読み込み時 (= SW wake 時) に組み立てる。
 * `chrome.runtime.onMessage.addListener` は同期登録が要件なので、await の前に呼ぶ。
 *
 * onVisited からは `rebuildIfStale()` で「古ければ再構築して」と依頼するだけ。
 * 差分更新は持たず、builtAt ベースの鮮度判定 (30 分) が実体ビルドを集約する。
 *
 * cache: ビルド成功ごとに chrome.storage.local へ丸ごと置き換え保存し、
 * SW wake 後の初回サジェストはロードだけで返す (フル再構築を待たせない)。
 */
const wordIndexService = createWordIndexService({
  getSourceTexts: async () => {
    await bookmarkHistoryStore.initialize();
    const items = await bookmarkHistoryStore.getAll();
    return items.map((it) => it.title);
  },
  cache: {
    load: loadWordIndexCache,
    save: saveWordIndexCache,
  },
});
chrome.runtime.onMessage.addListener(
  makeWordIndexMessageListener(wordIndexService),
);

async function initialize() {
  await bookmarkHistoryStore.initialize();

  const currentHistory = await getAllBrowserHistory();
  console.log("current history:", currentHistory.length);

  await bookmarkHistoryStore.insert(currentHistory);
  console.log("inserted histories:", currentHistory.length);

  onHistoryVisited(async (item) => {
    console.log("add new history:", item);

    await bookmarkHistoryStore.insert([item]);
    wordIndexService.rebuildIfStale();

    // JS でタイトルが設定される可能性があるため、10 秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updated = await getLatestHistoryByUrl(item.url);
        if (updated?.title && updated.title !== item.title) {
          console.log(
            `Updating title for: ${updated.url} from: ${item.title} to: ${updated.title}`,
          );
          await bookmarkHistoryStore.insert([updated]);
          wordIndexService.rebuildIfStale();
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
