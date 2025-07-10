import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import json from "@rollup/plugin-json";

export default defineConfig({
  plugins: [react(), json()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
