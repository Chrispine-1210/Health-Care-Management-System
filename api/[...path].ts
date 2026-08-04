import express from "express";
import { registerRoutes } from "../server/routes";
import { corsHeaders, correlationId, securityHeaders, sanitizeRequest, rateLimit } from "../server/security";
import { globalErrorHandler, notFoundHandler } from "../server/errorHandler";

const app = express();
app.disable("x-powered-by");
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
