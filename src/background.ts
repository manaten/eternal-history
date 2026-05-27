import {
  addText,
  buildWordIndex,
  lookupSuggestions,
  WordIndex,
} from "./domain/word-index";
import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import {
  getAllBrowserHistory,
  getLatestHistoryByUrl,
  onHistoryVisited,
} from "./infra/chrome/chrome-history";
import { loadWordIndex, saveWordIndex } from "./infra/word-index-store";
import {
  RebuildIndexResponse,
  RuntimeRequest,
  SuggestResponse,
} from "./types/messages";

/**
 * WordIndex は MV3 service worker のメモリに保持する。SW が kill されると失われるが、
 * 次の wake で {@link getIndex} が storage.local から復元する。
 * 初期構築 (~3 秒) は初回 / スキーマ更新時にだけ走る。
 */
// eslint-disable-next-line functional/no-let
let wordIndexPromise: Promise<WordIndex> | null = null;

/**
 * onVisited で 1 件来るたびに saveWordIndex を呼ぶと書き込みが過剰になるので、
 * 最後の更新から 5 秒待ってからまとめて書き込む。
 */
const SAVE_DEBOUNCE_MS = 5000;
// eslint-disable-next-line functional/no-let
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function initializeWordIndex(): Promise<WordIndex> {
  await bookmarkHistoryStore.initialize();

  const loaded = await loadWordIndex();
  if (loaded) {
    console.log(
      `WordIndex loaded from storage: ${loaded.wordCounts.size} words`,
    );
    return loaded;
  }

  console.log("WordIndex not found, building from scratch...");
  const t0 = performance.now();
  const items = await bookmarkHistoryStore.getAll();
  const built = buildWordIndex(items.map((it) => it.title));
  await saveWordIndex(built);
  console.log(
    `WordIndex built: ${built.wordCounts.size} words in ${(performance.now() - t0).toFixed(0)}ms`,
  );
  return built;
}

function getIndex(): Promise<WordIndex> {
  if (!wordIndexPromise) {
    wordIndexPromise = initializeWordIndex();
  }
  return wordIndexPromise;
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void (async () => {
      try {
        const index = await getIndex();
        await saveWordIndex(index);
      } catch (e) {
        console.error("Failed to save WordIndex:", e);
      }
    })();
  }, SAVE_DEBOUNCE_MS);
}

/**
 * ユーザー起動の再構築。DebugTools の「インデックス再構築」ボタンから呼ばれる。
 * 既存のインメモリ・ストレージ両方を新しい index で置き換える。
 */
async function rebuildIndex(): Promise<RebuildIndexResponse> {
  try {
    const t0 = performance.now();
    await bookmarkHistoryStore.initialize();
    const items = await bookmarkHistoryStore.getAll();
    const built = buildWordIndex(items.map((it) => it.title));
    await saveWordIndex(built);
    wordIndexPromise = Promise.resolve(built);
    const elapsedMs = performance.now() - t0;
    console.log(
      `WordIndex rebuilt: ${built.wordCounts.size} words in ${elapsedMs.toFixed(0)}ms`,
    );
    return { ok: true, wordCount: built.wordCounts.size, elapsedMs };
  } catch (e) {
    console.error("Failed to rebuild WordIndex:", e);
    return { ok: false, error: String(e) };
  }
}

async function initialize() {
  await bookmarkHistoryStore.initialize();

  const currentHistory = await getAllBrowserHistory();
  console.log("current history:", currentHistory.length);

  await bookmarkHistoryStore.insert(currentHistory);
  console.log("inserted histories:", currentHistory.length);

  // 起動時に WordIndex を読み込み or 構築。await して以後の onVisited で確実に使える状態にする。
  await getIndex();

  onHistoryVisited(async (item) => {
    console.log("add new history:", item);

    // 即座に保存
    await bookmarkHistoryStore.insert([item]);

    // 差分更新: タイトル中の新規単語を index に追加 (古いタイトルの巻き戻しはしない)
    const index = await getIndex();
    addText(index, item.title);
    scheduleSave();

    // JS でタイトルが設定される可能性があるため、10 秒待って再取得・更新
    setTimeout(async () => {
      try {
        const updated = await getLatestHistoryByUrl(item.url);
        if (updated?.title && updated.title !== item.title) {
          console.log(
            `Updating title for: ${updated.url} from: ${item.title} to: ${updated.title}`,
          );
          await bookmarkHistoryStore.insert([updated]);
          addText(index, updated.title);
          scheduleSave();
        }
      } catch (error) {
        console.warn("Failed to update history title:", error);
      }
    }, 1000 * 10);
  });
}

/**
 * UI からの suggest / rebuild リクエストを処理する。
 * Chrome の制約: 非同期レスポンスを返すには listener から true を返す必要がある。
 */
chrome.runtime.onMessage.addListener(
  (message: RuntimeRequest, _sender, sendResponse) => {
    if (message?.type === "suggest") {
      void (async () => {
        try {
          const index = await getIndex();
          const suggestions = lookupSuggestions(
            index,
            message.query,
            message.limit ?? 10,
          );
          const response: SuggestResponse = { suggestions };
          sendResponse(response);
        } catch (e) {
          console.error("suggest failed:", e);
          sendResponse({ suggestions: [] } satisfies SuggestResponse);
        }
      })();
      return true;
    }
    if (message?.type === "rebuild-index") {
      void rebuildIndex().then(sendResponse);
      return true;
    }
    return false;
  },
);

initialize().catch((e) => {
  console.error("Failed to initialize:", e);
});
