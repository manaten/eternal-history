import fs from "fs";

const MANIFEST_PATH = "./dist/manifest.json";

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
fs.writeFileSync(
  MANIFEST_PATH,
  JSON.stringify({ ...manifest, name: `${manifest.name} (dev)` }, null, 2) +
    "\n",
);

console.log(
  `Updated manifest.json name to ${manifest.name} (dev) for development build`,
);
console.log("Development build completed successfully!");
