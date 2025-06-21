import { useEffect, useState } from "react";

import { Root } from "./components/Root";
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

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getHistory = async (query = "") => {
    setIsLoading(true);
    setSearchQuery(query);
    try {
      await initializeStorage();
      const results: HistoryItem[] = query.trim()
        ? await search(query)
        : await getRecentHistories(3);
      setHistory(results);
    } catch (error) {
      console.error("Failed to get history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (item: HistoryItem) => {
    try {
      await deleteHistoryItem(item);
      setHistory((prev) => prev.filter((h) => h.url !== item.url));
    } catch (error) {
      console.error("Failed to delete history item:", error);
      alert("Failed to delete history item. Please try again.");
    }
  };

  const handleSaveQuery = async (query: string) => {
    try {
      await addSavedQuery(query);
      const updatedQueries = await getSavedQueries();
      setSavedQueries(updatedQueries);
    } catch (error) {
      console.error("Failed to save query:", error);
    }
  };

  const handleRemoveQuery = async (id: string) => {
    try {
      const message = "Are you sure you want to remove this query?";
      if (confirm(message)) {
        await removeSavedQuery(id);
        const updatedQueries = await getSavedQueries();
        setSavedQueries(updatedQueries);
      }
    } catch (error) {
      console.error("Failed to remove query:", error);
    }
  };

  const loadSavedQueries = async () => {
    try {
      const queries = await getSavedQueries();
      setSavedQueries(queries);
    } catch (error) {
      console.error("Failed to load saved queries:", error);
    }
  };

  useEffect(() => {
    getHistory();
    loadSavedQueries();
  }, []);

  return (
    <Root
      history={history}
      searchQuery={searchQuery}
      onSearch={getHistory}
      onSaveQuery={handleSaveQuery}
      savedQueries={savedQueries}
      onQueryRemove={handleRemoveQuery}
      isLoading={isLoading}
      onDeleteItem={handleDeleteItem}
    />
  );
}

export default App;
