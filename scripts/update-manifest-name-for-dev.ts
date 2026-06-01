import fs from "fs";

const MANIFEST_PATH = "./dist/manifest.json";

/**
 * dev ビルドの manifest 名末尾に ` (dev YYYYMMDDhhmm)` を付与する。
 * タイムスタンプはローカル時刻。拡張機能一覧で「今ロードした版に更新されているか」を
 * 一目で判別できるようにする。
 */
const pad = (n: number) => n.toString().padStart(2, "0");
const now = new Date();
const stamp = [
  now.getFullYear(),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
  pad(now.getHours()),
  pad(now.getMinutes()),
].join("");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
const newName = `${manifest.name} (dev ${stamp})`;
fs.writeFileSync(
  MANIFEST_PATH,
  JSON.stringify({ ...manifest, name: newName }, null, 2) + "\n",
);

console.log(`Updated manifest.json name to "${newName}" for development build`);
console.log("Development build completed successfully!");
