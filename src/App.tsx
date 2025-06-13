import { useEffect, useState } from "react";

import styles from "./App.module.css";
import { search, initializeStorage, getRecentHistories } from "./lib/storage";
import { HistoryItem } from "./types/HistoryItem";

function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const groupHistoriesByDate = (histories: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    histories.forEach((item) => {
      const date = new Date(item.lastVisitTime);
      const dateKey = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  };

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
        </div>
      </div>

      <div className={styles.Histories}>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          Object.entries(groupHistoriesByDate(history)).map(([date, items]) => (
            <div key={date} className={styles.DateGroup}>
              <div className={styles.DateHeader}>{date}</div>
              <div className={styles.DateItems}>
                {items.map((item) => {
                  const favicon = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
                  const time = new Date(item.lastVisitTime).toLocaleTimeString(
                    "ja-JP",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      className={styles.HistoryItem}
                      title={item.title || item.url}
                    >
                      <span className={styles.HistoryItem__Time}>{time}</span>
                      <img src={favicon} className={styles.HistoryItem__Icon} />
                      <div className={styles.HistoryItem__LinkContainer}>
                        <span className={styles.HistoryItem__Title}>
                          {item.title?.slice(0, 100) || item.url?.slice(0, 100)}
                        </span>
                        <span
                          className={styles.HistoryItem__Url}
                          title={item.url}
                        >
                          {item.url?.slice(0, 100)}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default App;
