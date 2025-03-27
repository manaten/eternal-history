import initSqlJs, { Database } from "sql.js";

let db: Database;

function saveDb() {
  const binaryArray = db.export();
  chrome.storage.local.set({ sqliteDb: Array.from(binaryArray) });
}

export async function initDb() {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`, // wasmの場所
  });

  // 初回なら新規作成、保存済みがあれば読み込み
  const saved = await chrome.storage.local.get(["sqliteDb"]);
  if (saved.sqliteDb) {
    db = new SQL.Database(new Uint8Array(saved.sqliteDb));
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        visited_at DATETIME
      );
    `);
    saveDb();
  }
}

export function saveHistory(title: string, url: string) {
  const now = new Date().toISOString();
  db.run("INSERT INTO history (title, url, visited_at) VALUES (?, ?, ?)", [
    title,
    url,
    now,
  ]);
  saveDb();
}
