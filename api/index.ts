import express from "express";
import { registerRoutes } from "../server/routes.js";
import { corsHeaders, correlationId, securityHeaders, sanitizeRequest, rateLimit } from "../server/security.js";
import { globalErrorHandler, notFoundHandler } from "../server/errorHandler.js";

const app = express();
app.disable("x-powered-by");

// Vercel invokes this single function after rewriting /api/* to /api.
// Restore the original API path before Express performs route matching.
app.use((req, _res, next) => {
  const url = new URL(req.url, 'https://internal.invalid');
  const path = url.searchParams.get('__path');
  if (path !== null) {
    url.searchParams.delete('__path');
    const query = url.searchParams.toString();
    req.url = `/api/${path}${query ? `?${query}` : ''}`;
  }
  next();
});
app.use(corsHeaders);
app.use(securityHeaders);
app.use(correlationId);
app.use(rateLimit());
app.use('/api/auth/login', rateLimit(15 * 60 * 1000, 10));
app.use('/api/auth/register', rateLimit(60 * 60 * 1000, 5));
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buffer) => {
    req.rawBody = buffer;
  },
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(sanitizeRequest);

await registerRoutes(app);
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
