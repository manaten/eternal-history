import { useEffect, useState } from "react";

import styles from "./App.module.css";
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
    <main className={styles.Root}>
      <div>
        <h1 className={styles.Title}>Eternal History</h1>
        <div className={styles.SubTitle}>
          <p>{history.length} histories</p>
        </div>

        <div style={{ margin: "16px 0" }}>
          <input
            ref={(e) => e?.focus()}
            type='text'
            placeholder='Search history...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                getHistory(searchQuery);
              }
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={() => getHistory(searchQuery)}
            disabled={isLoading}
            style={{
              marginTop: "8px",
              padding: "8px 16px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <div className={styles.Histories}>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          history.map((item) => {
            const favicon = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
            return (
              <div
                key={item.id}
                className={styles.HistoryItem}
                style={{ display: "flex", gap: "8px", flexDirection: "row" }}
              >
                <span className={styles.HistoryItem__Date}>
                  {new Date(item.lastVisitTime).toLocaleDateString()}
                </span>
                <img src={favicon} className={styles.HistoryItem__Icon} />
                <div className={styles.HistoryItem__LinkContainer}>
                  <a
                    href={item.url}
                    className={styles.HistoryItem__Link}
                    title={item.title || item.url}
                  >
                    {item.title?.slice(0, 100) || item.url?.slice(0, 100)}
                  </a>
                  <span className={styles.HistoryItem__Url} title={item.url}>
                    {item.url?.slice(0, 100)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

export default App;
