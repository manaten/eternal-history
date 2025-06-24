import fs from "fs";

const MANIFEST_PATH = "./public/manifest.json";
const PACKAGE_JSON_PATH = "./package.json";

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8"));

fs.writeFileSync(
  MANIFEST_PATH,
  JSON.stringify({ ...manifest, version: pkg.version }, null, 2) + "\n",
);

console.log(`Updated manifest.json version to ${pkg.version}`);
