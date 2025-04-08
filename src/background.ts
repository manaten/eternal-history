import initSqlJs, { Database } from "sql.js";

// SQLiteまわりの状態
let db: Database;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// IndexedDBのキー名
const DB_STORAGE_KEY = "sqlite_backup";

async function loadDatabase(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const saved = await chrome.storage.local.get([DB_STORAGE_KEY]);
  if (saved[DB_STORAGE_KEY]) {
    const data = new Uint8Array(saved[DB_STORAGE_KEY]);
    db = new SQL.Database(data);
    console.log("SQLite DB を復元したのだ");
  } else {
    db = new SQL.Database();
    console.log("新しいSQLite DBを作成したのだ");
    db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        visited_at DATETIME
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS history_fts USING fts5(title, url, content='history', content_rowid='id');
    `);
  }
}

function saveHistoryEntry(url: string, title: string) {
  const now = new Date().toISOString();

  db.run("INSERT INTO history (url, title, visited_at) VALUES (?, ?, ?);", [
    url,
    title,
    now,
  ]);
  db.run(
    "INSERT INTO history_fts (rowid, title, url) VALUES (last_insert_rowid(), ?, ?);",
    [title, url],
  );

  scheduleSave();
}

function scheduleSave() {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const binaryArray = db.export();
    chrome.storage.local.set({
      [DB_STORAGE_KEY]: Array.from(binaryArray),
    });
    console.log("SQLite DB を保存したのだ");
  }, 3000);
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadDatabase();

  chrome.history.onVisited.addListener(({ url, title }) => {
    if (url && title) saveHistoryEntry(url, title);
  });

  console.log("background.ts が初期化されたのだ");
});

chrome.history.onVisited.addListener((historyItem) => {
  console.log("訪問した履歴:", historyItem);
  // SQLiteに保存とかやる処理を書くのだ
});
