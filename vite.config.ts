import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  // root は client (UI の html/css/tsx が住む場所)。worker のエントリは
  // rollupOptions.input で root 外から直接指定する。
  root: "./src/client",
  publicDir: "../../public",

  plugins: [react(), tailwindcss(), svgr()],

  define: {
    "import.meta.vitest": "undefined",
    // build:dev (npm run build:dev) で DEV_BUILD=true が設定される。
    // 本番ビルドでは false に評価される。
    __DEV_BUILD__: JSON.stringify(process.env.DEV_BUILD === "true"),
  },

  build: {
    outDir: "../../dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: "./src/client/index.html",
        options: "./src/client/options.html",
        background: "./src/worker/index.ts",
      },
      output: {
        entryFileNames: (chunk) => {
          switch (chunk.name) {
            case "background":
              return "background.js";
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
