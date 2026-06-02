import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don't exit - let the app continue without Vite
        throw new Error(`Vite error: ${msg}`);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (!acceptsHtml(req)) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

function acceptsHtml(req: express.Request) {
  if (req.method !== "GET") {
    return false;
  }

  const acceptsHtml = req.headers.accept?.includes("text/html") ?? false;
  const isNavigation = req.headers["sec-fetch-mode"] === "navigate";

  return req.path === "/" || acceptsHtml || isNavigation;
}

export function serveStatic(app: Express) {
  const candidateDistPaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
  ];
  const distPath = candidateDistPaths.find((candidate) => fs.existsSync(candidate));

  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Checked: ${candidateDistPaths.join(", ")}. Make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html') || filePath.endsWith('service-worker.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // Fall through to index.html only for browser navigations. Asset misses such as
  // /service-worker.js should 404 instead of receiving the SPA shell or another
  // JavaScript bundle, which can leave browsers displaying/caching server code.
  app.use("*", (req, res, next) => {
    if (!acceptsHtml(req)) {
      return next();
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
