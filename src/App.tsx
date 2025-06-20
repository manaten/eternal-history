import { useEffect, useState } from "react";

import { Root } from "./components/Root";
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
    const confirmMessage = `Are you sure you want to delete this item?\n\n${item.title || item.url}`;
    if (window.confirm(confirmMessage)) {
      try {
        await deleteHistoryItem(item);
        // Remove from local state immediately for better UX
        setHistory((prev) => prev.filter((h) => h.url !== item.url));
      } catch (error) {
        console.error("Failed to delete history item:", error);
        alert("Failed to delete history item. Please try again.");
      }
    }
  };

  useEffect(() => {
    getHistory();
  }, []);

  return (
    <Root
      history={history}
      searchQuery={searchQuery}
      onSearch={getHistory}
      isLoading={isLoading}
      onDeleteItem={handleDeleteItem}
    />
  );
}

export default App;
