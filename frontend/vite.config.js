import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "/Frontend/src": resolve(__dirname, "src"),
    },
  },
  root: ".",
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
});
