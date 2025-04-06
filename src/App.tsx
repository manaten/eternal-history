import { useState } from "react";

import "./App.css";

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

  return (
    <>
      <h1>Vite + React</h1>
      <div className='card'>
        <button onClick={getHistory}>get history</button>
        <p>{history.length} histories</p>
      </div>
      <div>
        {history.map((item) => {
          const domain = new URL(item.url || "").hostname;
          const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
          return (
            <div
              key={item.id}
              className='card'
              style={{ display: "flex", gap: "8px", flexDirection: "row" }}
            >
              <p>{new Date(item.lastVisitTime || 0).toLocaleDateString()}</p>
              <img src={favicon} />
              <a href={item.url}>{item.title}</a>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
