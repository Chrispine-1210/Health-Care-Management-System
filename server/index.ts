// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedTestData } from "./testData";
import { corsHeaders, securityHeaders, sanitizeRequest, rateLimit } from "./security";
import { inventoryIntelligenceService } from "./inventoryIntelligence";

const app = express();
app.disable("x-powered-by");
app.use(corsHeaders);
app.use(securityHeaders);
app.use(rateLimit());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ──────────────────────────────
// BODY PARSERS
// ──────────────────────────────
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeRequest);

// ──────────────────────────────
// REQUEST LOGGING
// ──────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// ──────────────────────────────
// MAIN ASYNC INIT
// ──────────────────────────────
(async () => {
  // Seed test data
  await seedTestData();

  // Start inventory automation and register routes
  inventoryIntelligenceService.startDailyScheduler();
  const server = await registerRoutes(app);

  // GLOBAL ERROR HANDLER
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Vite dev server or production static
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // START SERVER
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`Server running on port ${port}`);
    }
  );
})();
