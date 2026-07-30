# Health Care Management System Security Audit

Date: 2026-07-30  
Revision: `0480a9c972aba8dfd894863e3e92293c1e2e805b`  
Scope: repository-wide static review of the active Express server, authentication, authorization, patient-data handling, secrets, and dependency manifest.

## Executive summary

The system is not ready for production use with real patient or pharmacy data. The audit confirmed three critical issues, three high-risk security issues, and several defense-in-depth gaps. The most urgent problems are production-reachable demo administrator credentials, cross-user access to orders and appointments, unrestricted mutation of orders and appointments, and live database credentials committed to Git history.

## Confirmed findings

### HC-01: Built-in administrator account with a public password

Severity: Critical

`AuthService` creates five accounts on every process start, including `admin@thandizo.com` with password `password` (`server/authSystem.ts:291`, `server/authSystem.ts:300-320`). The public login endpoint authenticates these accounts and returns bearer and refresh tokens (`server/auth-routes.ts:37-54`). The resulting administrator token passes `requireRole('admin')` throughout the active route set.

Impact: An unauthenticated attacker can obtain administrator access, read patient and operational data, change user roles, manage products and branches, and access audit logs.

Remediation: Remove demo-user initialization from runtime code. Store users in the database, bootstrap the first administrator through a one-time out-of-band process, require a password reset, and add a production startup assertion that rejects seeded/default credentials.

### HC-02: Broken object-level authorization on orders

Severity: Critical

Any authenticated user can fetch any order and its items by identifier (`server/routes.ts:479-487`). Any authenticated user can also patch any order with an unrestricted body (`server/routes.ts:560-563`). Neither handler checks ownership, assigned driver, staff role, nor an allowed-field schema.

Impact: A customer can read another patient's delivery details and purchase history, then alter status, totals, payment state, customer identity, or delivery information depending on the storage implementation.

Remediation: Centralize an order authorization policy. Permit customers to read only their own orders; assigned drivers only the delivery fields they need; pharmacy staff only within their branch; and administrators under explicit audited access. Replace mass assignment with role-specific Zod schemas and state-transition commands.

### HC-03: Broken object-level authorization on appointments

Severity: Critical

The first registered patient-history endpoint returns appointments for an arbitrary `patientId` to any authenticated user (`server/routes.ts:729-732`). Later duplicate routes repeat the issue (`server/routes.ts:904-917`). Any authenticated user can list every appointment (`server/routes.ts:904-907`), fetch any appointment (`server/routes.ts:938-944`), and update any appointment with an unrestricted body (`server/routes.ts:951-954`). The earlier create handler also accepts an arbitrary patient ID supplied in the request (`server/routes.ts:739-744`).

Impact: Cross-patient disclosure and modification of protected health information, appointment schedules, and clinical context.

Remediation: Enforce patient ownership and explicit clinician/staff scopes on every read and write. Remove duplicate route declarations, derive patient identity from the authenticated principal for patient actions, validate allowed update fields, and audit every clinical-record access.

### HC-04: Database credentials and application secrets committed to Git

Severity: High

`.env` is tracked and has been committed since revision `3f1a602`. It contains non-placeholder database URLs, database passwords, and a session secret. There is no root `.gitignore`.

Impact: Anyone with repository or historical clone access may connect to the database or forge sessions, potentially exposing or modifying patient data.

Remediation: Immediately rotate every credential in `.env`, revoke old database credentials, invalidate sessions, remove `.env` from tracking and Git history, add a restrictive `.gitignore`, and enable secret scanning and push protection. Treat rotation as mandatory even if repository visibility is currently private.

### HC-05: Weak password derivation

Severity: High

Passwords are hashed with a single HMAC/SHA operation whose `iterations` value is appended as data rather than used as a work factor (`server/authSystem.ts:50-64`). The similar helper in `server/security.ts` uses one SHA-256 operation. These fast hashes are unsuitable for password storage.

Impact: A stolen credential store can be cracked efficiently, especially for reused or low-entropy passwords.

Remediation: Use Argon2id with calibrated memory/time parameters or Node's `scrypt`; store algorithm and parameters with each hash; migrate on successful login; and apply breached-password checks.

### HC-06: Sensitive API responses are written to application logs

Severity: High

The global request logger serializes every JSON response for `/api` routes (`server/index.ts:38-57`). Although output is truncated, the prefix can contain bearer/refresh tokens from login responses, patient names, prescription details, order data, or operational identifiers.

Impact: Secrets and protected health information can leak into console, hosting, aggregation, and support logs with broader retention and access than the source record.

Remediation: Log only route templates, status, duration, request/correlation ID, and approved metadata. Never log response bodies. Add structured redaction for authorization headers, tokens, credentials, patient identifiers, and clinical data.

### HC-07: Patient-data encryption silently uses shared or development keys

Severity: Medium

Encryption derives its AES key from `PATIENT_DATA_ENCRYPTION_KEY`, then falls back to `JWT_SECRET`, then a hard-coded development string (`server/cryptoService.ts:5-7`). This permits predictable encryption and couples token-secret rotation to stored data decryption.

Impact: Misconfigured deployments can provide ineffective encryption at rest or lose access to encrypted records during unrelated secret rotation.

Remediation: Require a dedicated, versioned encryption key in every environment, fail startup if absent, use a managed KMS/envelope-encryption design, and document key rotation and recovery.

### HC-08: Authenticated notification relay permits cross-user messaging

Severity: Medium

Any authenticated user can invoke `/api/notifications/send`, choose any existing `userId`, select a template including `custom`, and supply arbitrary template data (`server/email-routes.ts:70-85`). No ownership, staff role, consent, or rate-specific authorization is enforced.

Impact: Spam, social engineering, disclosure through attacker-controlled templates, and consumption of email/SMS resources.

Remediation: Restrict event creation to authorized server-side workflows or staff roles, use server-derived recipient and template data, enforce opt-out/consent policy, and add endpoint-specific rate limits.

## Additional risks

- Access tokens and refresh tokens are stored in browser `localStorage` (`client/src/lib/authSession.ts:28-29`), increasing the impact of any XSS. Prefer secure, HTTP-only, same-site cookies with CSRF protection or keep access tokens only in memory.
- The in-memory rate limiter is per process, unbounded, and keyed by raw path. It is ineffective across replicas and permits memory growth through unique paths (`server/security.ts:9-10`, `server/security.ts:37-58`).
- Request bodies have no explicit JSON size limit (`server/index.ts:25-31`). Set conservative endpoint-specific limits, especially for prescription uploads.
- Error handlers expose `String(error)` on authentication and email routes, which can disclose schema and internal error details.
- Duplicate route declarations make authorization behavior order-dependent and increase the chance that a secured handler is shadowed by an earlier insecure handler.

## Dependency and build checks

`npm audit --omit=dev` reported three advisories: high-severity `postcss` path traversal/file disclosure, high-severity `brace-expansion` denial of service, and low-severity `body-parser` denial of service. Fixes are available. Production reachability of the build-tool advisories should be confirmed, but lockfile updates are warranted.

`npm run check` could not run because dependencies are not installed in the workspace (`tsc` was not found). No automated security tests exist in `package.json`; the project exposes only build, type-check, start, development, and database-push scripts.

## Remediation order

1. Disable public deployment, remove demo accounts, and rotate every committed secret.
2. Fix order and appointment object authorization and replace unrestricted updates with allowlisted schemas.
3. Stop response-body logging and restrict notification sending.
4. Replace password hashing and require a dedicated patient-data encryption key.
5. Update dependencies, install from the lockfile, run type/build checks, and add integration tests for cross-user and cross-role denial.
6. Add CI gates for secret scanning, dependency auditing, type checking, authorization tests, and production configuration validation.

## Verification criteria

The critical findings are closed only when automated tests prove that a customer cannot read or mutate another customer's orders, prescriptions, or appointments; drivers cannot access unassigned deliveries; staff access is branch-scoped; default credentials cannot authenticate; old committed secrets are revoked; and logs contain neither authentication tokens nor patient response bodies.
