import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  publicDir: "../public",

  plugins: [react()],

  define: {
    "import.meta.vitest": "undefined",
  },

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: "./src/index.html",
        background: "./src/background.ts",
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
