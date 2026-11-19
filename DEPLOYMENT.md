# Deployment Runbook

## Release posture

This repository is not certified for healthcare regulatory compliance. Use synthetic data in previews. Production processing of patient, prescription or payment data requires independent security, privacy, clinical and regulatory approval.

## Supported deployment modes

### Review/staging on Vercel

The production build generates the web client, service worker, Node bundle and `api/vercel-handler.js`. Vercel can serve the client and route `/api/*` requests to the serverless adapter.

Use this mode for previews and controlled staging. Serverless instances do not share in-memory rate limits, caches, scheduled jobs or WebSocket state.

### Recommended production API

Run `dist/server/index.js` on a persistent managed Node.js 24 service, with the client hosted on Vercel/CDN and `VITE_API_BASE_URL` pointing to the API. Move rate limiting, revocation/cache state, background work and realtime coordination to shared managed services.

## Required production configuration

- `NODE_ENV=production`
- `DATABASE_URL` — restricted PostgreSQL connection string
- `USE_DATABASE_STORAGE=true`
- `JWT_SECRET` — independent random secret of at least 32 characters
- `PATIENT_DATA_ENCRYPTION_KEY` — different random key of at least 32 characters
- `ALLOWED_ORIGINS` — comma-separated HTTPS origins; wildcards are rejected
- `VITE_API_BASE_URL` — production API origin used during the client build

Optional settings include `PORT`, `DB_POOL_MAX`, SMTP variables and payment-provider credentials. Keep local, staging and production secrets separate.

## Build and validation

```bash
npm ci
npm run check
npm test
npm run migration:check
npm run route-security:check
npm run build
```

Builds must not apply database migrations. A preview or repeated build may run concurrently and must remain read-only with respect to schema state.

## Controlled migrations

Run migrations once through `.github/workflows/migrate.yml` or an equivalent protected release job:

1. Back up the target database and verify restore readiness.
2. Apply to staging and validate integrity plus application smoke tests.
3. Obtain production approval.
4. Run the production migration once with the environment-scoped `DATABASE_URL`.
5. Deploy compatible application instances and monitor.

Migrations are forward-only by default. Never automate destructive rollback or delete legacy rows as remediation.

## Runtime start

```bash
npm run db:migrate  # controlled one-off step, not per replica
npm start
```

The application listens on `PORT` and handles `SIGTERM`/`SIGINT` for graceful shutdown.

## Health and monitoring

- `/health` proves the process and router are alive.
- `/ready` returns `503` when required configuration is absent or the configured database is unreachable.
- Monitor latency, error rate, authorization denials, emergency access, payment reconciliation, reservation balance and audit-write failures.
- Do not log request or response bodies containing patient, credential or payment data.

## Rollout and rollback

1. Deploy to staging from the exact release commit.
2. Run the smoke tests in `TESTING.md`.
3. Apply the reviewed production migration.
4. Roll out gradually and monitor the defined acceptance window.
5. Roll back the application artifact on regression; do not reverse data migrations unless a reviewed recovery plan proves it safe.

## Secret incident requirement

Removing a committed `.env` file does not revoke its contents. Before production, rotate every database, session and identity-provider credential that may have appeared in repository history, invalidate old values, verify access logs and coordinate any history rewrite with all collaborators.

