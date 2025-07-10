import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/SimpleSwap-Frontend/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
