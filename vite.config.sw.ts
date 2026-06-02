import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
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
});
