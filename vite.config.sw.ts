import { defineConfig } from "vite";
import typescript from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    lib: {
      entry: "client/src/service-worker.ts",
      name: "ServiceWorker",
      fileName: "service-worker",
      formats: ["es"],
    },
    outDir: "dist/public",
    emptyOutDir: false,
    minify: true,
    rollupOptions: {
      output: {
        entryFileNames: "service-worker.js",
      },
    },
  },
  plugins: [typescript()],
});
