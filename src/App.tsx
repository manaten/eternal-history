import { useEffect, useState } from "react";

import styles from "./App.module.css";
import { Header } from "./components/Header";
import { Histories } from "./components/Histories";
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
    <main className={styles.root}>
      <Header
        historyCount={history.length}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={getHistory}
        isLoading={isLoading}
      />
      <Histories history={history} isLoading={isLoading} />
    </main>
  );
}

export default App;
