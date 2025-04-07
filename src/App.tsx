import { useEffect, useState } from "react";

import styles from "./App.module.css";

function App() {
  const [history, setHistory] = useState<chrome.history.HistoryItem[]>([]);

  const getHistory = () => {
    chrome.history.search(
      {
        text: "", // 空文字で全件取得対象
        startTime: 0, // 1970年から現在まで全部
        maxResults: 999999, // 上限を必要なだけ大きくする
      },
      (results) => {
        setHistory(results);
      },
    );
  };

  useEffect(() => {
    getHistory();
  }, []);

  return (
    <main className={styles.Root}>
      <div>
        <h1 className={styles.Title}>Infinite History</h1>
        <div className={styles.SubTitle}>
          <p>{history.length} histories</p>
        </div>
      </div>

      <div className={styles.Histories}>
        {history.map((item) => {
          const domain = new URL(item.url || "").hostname;
          const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
          return (
            <div
              key={item.id}
              className={styles.HistoryItem}
              style={{ display: "flex", gap: "8px", flexDirection: "row" }}
            >
              <span className={styles.HistoryItem__Date}>
                {new Date(item.lastVisitTime || 0).toLocaleDateString()}
              </span>
              <img src={favicon} className={styles.HistoryItem__Icon} />
              <div className={styles.HistoryItem__LinkContainer}>
                <a href={item.url} className={styles.HistoryItem__Link}>
                  {item.title}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default App;
