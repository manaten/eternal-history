import { useEffect, useState } from "react";

import { Root } from "./components/Root";
import { search, initializeStorage, getRecentHistories } from "./lib/storage";
import { HistoryItem } from "./types/HistoryItem";

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const getHistory = async (query = "") => {
    setIsLoading(true);
    try {
      await initializeStorage();
      let results: HistoryItem[];
      if (query.trim()) {
        results = await search(query);
      } else {
        results = await getRecentHistories(3);
      }
      setHistory(results);
    } catch (error) {
      console.error("Failed to get history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getHistory();
  }, []);

  return (
    <Root
      history={history}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSearch={getHistory}
      isLoading={isLoading}
    />
  );
}

export default App;
