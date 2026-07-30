# Backend Deployment

This repository is not certified for healthcare regulatory compliance. Deploy the API only to an authenticated persistent Node.js platform after security review and staging validation. Vercel serves the static frontend only.

## Required production configuration

- `NODE_ENV=production`
- `DATABASE_URL`: PostgreSQL connection string
- `USE_DATABASE_STORAGE=true`
- `JWT_SECRET`: independent random secret of at least 32 characters
- `PATIENT_DATA_ENCRYPTION_KEY`: independent random key of at least 32 characters
- `ALLOWED_ORIGINS`: comma-separated HTTPS frontend origins; wildcards are rejected
- `VITE_API_BASE_URL`: staging or production API origin used during frontend build

Optional settings include `PORT`, `DB_POOL_MAX`, SMTP variables, and payment-provider credentials. Keep staging and production secrets separate.

## Execution order

```bash
npm ci
npm run check
npm test
npm run build
npm run db:migrate
npm start
```

Migrations are forward-only in production. `0000_healthcare_roles.sql` renames legacy enum values without deleting users. Rolling back enum renames after new role values have been written requires a reviewed data migration. `0001_immutable_audit_logs.sql` can be rolled back only by explicitly dropping its trigger and function, which re-enables destructive audit changes.

`0003_healthcare_integrity_constraints.sql` installs foreign keys and numeric checks as `NOT VALID`. PostgreSQL enforces them for new writes while allowing deployment before legacy-data cleanup. Before marking them validated, inventory orphaned references and invalid amounts, remediate them under an approved data-change plan, then run `ALTER TABLE ... VALIDATE CONSTRAINT` individually. The composite unique index requires duplicate order lines to be consolidated before migration execution. Do not drop or truncate rows as an automated remediation.

## Container

```bash
docker build -t thandizo-api .
docker run --rm -p 5000:5000 --env-file .env.production thandizo-api
```

Run `npm run db:migrate` as a one-off release command before replacing application instances. Do not run migrations concurrently from every replica.

## Operations

- `/health` proves that the process and router are alive.
- `/ready` returns 503 when required configuration is absent or the configured database is unreachable.
- `SIGTERM` and `SIGINT` stop accepting requests, close the HTTP server and drain the database pool.
- Back up and test restore procedures before applying migrations.
- Emergency-access grants are currently process-local and are not suitable for multiple replicas; persistent grant storage remains required before production use.
