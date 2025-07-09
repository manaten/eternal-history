import { useCallback, useEffect, useState } from "react";

import { Root } from "./components/Root";
import { t } from "./i18n";
import {
  getSavedQueries,
  addSavedQuery,
  removeSavedQuery,
  SavedQuery,
} from "./lib/savedQueries";
import {
  search,
  initializeStorage,
  getRecentHistories,
  deleteHistoryItem,
} from "./lib/storage";
import { HistoryItem } from "./types/HistoryItem";

const SESSION_STORAGE_KEY = "eternal-history-search-query";

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | null>(
    null,
  );
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getHistory = useCallback(async (query = "") => {
    const trimmedQuery = query.trim();
    setIsLoading(true);
    setCurrentSearchQuery(trimmedQuery);

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, trimmedQuery);

      await initializeStorage();
      const results: HistoryItem[] = trimmedQuery
        ? await search(trimmedQuery)
        : await getRecentHistories(3);
      setHistory(results);
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
        await deleteHistoryItem(item);
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
    const savedQuery = sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "";
    setInitialSearchQuery(savedQuery);
    getHistory(savedQuery);
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
      onDeleteHistoryItem={handleDeleteHistoryItem}
      initialSearchQuery={initialSearchQuery}
    />
  );
}

export default App;
