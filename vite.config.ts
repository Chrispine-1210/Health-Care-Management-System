import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    // Let Rollup/Vite determine chunk boundaries. The previous manual vendor
    // split produced circular chunks on Vercel that could break module startup.
  },
  css: {
    postcss: {
      from: path.resolve(import.meta.dirname, "client/src/index.css"),
    },
  },
  server: {
    middlewareMode: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5000,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
