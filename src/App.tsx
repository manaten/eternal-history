import { useCallback, useEffect, useState } from "react";

import { Root } from "./components/history/Root";
import { HistoryItem } from "./domain/history/HistoryItem";
import { searchHistories } from "./domain/history/searchHistories";
import { t } from "./i18n";
import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import {
  getSavedQueries,
  addSavedQuery,
  removeSavedQuery,
  SavedQuery,
} from "./lib/savedQueries";
import { getSettings } from "./lib/settings";

const SESSION_STORAGE_KEY = "eternal-history-search-query";

/**
 * 検索結果として UI に渡す最大件数。
 * 大量にヒットしても、レンダリングコストとの兼ね合いで現実的な上限で打ち切る。
 */
const MAX_SEARCH_RESULTS = 1000;

function getInitialQuery() {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "";
  } catch (_) {
    return "";
  }
}

function saveInitialQuery(query: string) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, query);
  } catch (error) {
    // セッションストレージの保存に失敗した場合は何もしない
    console.error("Failed to set initial query in session storage:", error);
  }
}

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | null>(
    null,
  );
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [truncatedAt, setTruncatedAt] = useState<number | undefined>(undefined);

  const getHistory = useCallback(async (query = "") => {
    const trimmedQuery = query.trim();
    setIsLoading(true);
    setCurrentSearchQuery(trimmedQuery);
    saveInitialQuery(trimmedQuery);

    try {
      await bookmarkHistoryStore.initialize();
      const results: HistoryItem[] = trimmedQuery
        ? await searchHistories(bookmarkHistoryStore, trimmedQuery, {
            ...(await getSettings()).search,
            limit: MAX_SEARCH_RESULTS,
          })
        : await bookmarkHistoryStore.getRecent(3);
      setHistory(results);
      setTruncatedAt(
        trimmedQuery !== "" && results.length === MAX_SEARCH_RESULTS
          ? MAX_SEARCH_RESULTS
          : undefined,
      );
    } catch (error) {
      console.error("Failed to get history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteHistoryItem = useCallback(async (item: HistoryItem) => {
    try {
      const message = t("app.confirmDeleteHistoryItem", {
        title: item.title || item.url,
      });
      if (confirm(message)) {
        await bookmarkHistoryStore.delete(item);
        setHistory((prev) => prev.filter((h) => h.url !== item.url));
      }
    } catch (error) {
      console.error("Failed to delete history item:", error);
      alert(t("app.deleteHistoryItemFailed"));
    }
  }, []);

  const handleSaveQuery = useCallback(async (query: string) => {
    try {
      await addSavedQuery(query);
      const updatedQueries = await getSavedQueries();
      setSavedQueries(updatedQueries);
    } catch (error) {
      console.error("Failed to save query:", error);
    }
  }, []);

  const handleRemoveSavedQuery = useCallback(async (id: string) => {
    try {
      const message = t("app.confirmRemoveQuery");
      if (confirm(message)) {
        await removeSavedQuery(id);
        const updatedQueries = await getSavedQueries();
        setSavedQueries(updatedQueries);
      }
    } catch (error) {
      console.error("Failed to remove query:", error);
    }
  }, []);

  const loadSavedQueries = async () => {
    try {
      const queries = await getSavedQueries();
      setSavedQueries(queries);
    } catch (error) {
      console.error("Failed to load saved queries:", error);
    }
  };

  useEffect(() => {
    const initialSearchQuery = getInitialQuery();
    setInitialSearchQuery(initialSearchQuery);
    getHistory(initialSearchQuery);
    loadSavedQueries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- 初期化時に一回だけ動けばよいため

  if (initialSearchQuery === null) {
    return null; // 初期化中は何も表示しない
  }

  return (
    <Root
      history={history}
      searchQuery={currentSearchQuery}
      onSearch={getHistory}
      onSaveQuery={handleSaveQuery}
      savedQueries={savedQueries}
      onSavedQueryRemove={handleRemoveSavedQuery}
      isLoading={isLoading}
      truncatedAt={truncatedAt}
      onDeleteHistoryItem={handleDeleteHistoryItem}
      initialSearchQuery={initialSearchQuery}
    />
  );
}

export default App;
