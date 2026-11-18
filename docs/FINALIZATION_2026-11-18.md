# Thandizo finalization evidence — 18 November 2026

## Decision boundary

This revision completes a release-hardening pass on draft PR #15. It does not authorize production activation or certify use with real patient data. Mainline has not been merged or rewritten.

## Changes delivered

- The API and migration runner share one database selection rule: an explicit `DATABASE_URL` takes precedence over integration-provided `POSTGRES_URL`.
- Both Node and Vercel entry points validate production configuration. Readiness requires persistent storage, independent secrets, explicit HTTPS origins and a successful database query.
- API responses prohibit browser and CDN caching. Service-worker v3 does not cache or replay API/authenticated responses and removes older Thandizo caches. Account changes and logout clear the complete query cache.
- Checkout submits product IDs, quantities and the chosen branch/prescription. Prices, totals, customer identity and payment status remain server-controlled. The UI exposes cash on delivery while online payment delivery remains unimplemented.
- Order creation rejects missing/closed branches and inactive products. Order listings for branch operations use the actor's branch and fail closed when no branch is assigned.
- Order, prescription and notification hooks use the active authentication token and configured API base URL.
- Production email uses SMTP with an explicit `SMTP_FROM` sender, timeouts and provider acceptance checks. Missing configuration, rejection and transport failures return failure. Automated tests use an injected transport and send no real messages.
- The unimplemented SMS provider cannot report production delivery success.
- Zod, Drizzle-Zod, Vite, runtime transitive dependencies and Node types were updated. Tailwind's animation build plugin is classified as a development dependency; the unused Tailwind Vite plugin was removed. The CSS build remains on Tailwind 3.
- The test command uses Node's TS import hook and quoted discovery, avoiding the TSX CLI's IPC dependency.

## Verification

| Check | Evidence / limit |
| --- | --- |
| Node runtime | Node 24 |
| TypeScript | `npm run check` |
| Automated tests | `npm test`: 53 tests; includes offline private-data non-replay, legacy-cache purge, no-store HTTP headers, configuration rejection, SMTP acceptance/failure and checkout/branch isolation |
| Migration integrity | 12 ordered migration files validated |
| Authorization register | Regenerated register covers 91 routes |
| Production build | Client, service worker, persistent Node bundle and Vercel adapter |
| Runtime dependency audit | Zero known findings with `npm audit --omit=dev` |
| Full dependency audit | 15 development-only findings: 4 moderate, 11 high; no critical. Primarily Picomatch/Tailwind/Vite and Drizzle tooling. These remain disclosed; the runtime classification does not remediate development-tool vulnerabilities. |
| Preview database inspection | Read-only metadata inspection found 21 public tables and all 12 migration ledger entries. This does not prove dispensing/payment journeys, backup restoration or production readiness. |
| GitHub-hosted checks before this revision | Quality Gate run `31787199356` failed with no executable steps or job logs. Fresh post-push status must be evaluated separately. |

The existing transaction tests use a controlled test implementation. They must not be presented as a live PostgreSQL concurrency certification.

## Preview configuration

All environment changes in this pass are restricted to Preview branch `agent/security-hardening`:

- Project: `health-care-management-system` (`prj_y9vdSwjuRqa0NPjHGjZ3aHJ3QKtF`).
- PostgreSQL project: `steep-firefly-97657954`.
- PostgreSQL Preview branch: `br-winter-glitter-zawsxmfl`, named `preview/agent/security-hardening`; distinct from default branch `br-frosty-lab-zay0as5x`.
- `DATABASE_URL` is explicitly assigned to that Preview database branch.
- The Preview signing secret is replaced with a new random value; prior Preview sessions require login again.
- A separate random `PATIENT_DATA_ENCRYPTION_KEY` and exact branch-alias `ALLOWED_ORIGINS` are configured.
- `USE_DATABASE_STORAGE=true` is explicit.
- No production environment values, database contents or migrations were changed.

The old Preview's `/api/ready` returned HTTP 503 before repair. The exact revised deployment's health/readiness/authorization/cache responses must be recorded with its commit in PR #15 after deployment.

## Remaining release work

1. Close the historical credential incident. The public default branch still tracks `.env`; deleting it in a PR does not revoke past values. Inventory and rotate affected credentials, verify old values no longer work, inspect access logs and agree on any history rewrite. Protect real data and retain keys needed to decrypt existing encrypted records.
2. Require executed quality/security checks on the release commit, plus independent review. A synthetic startup failure or successful Vercel build is not an executed test result. Configure and verify protected branches/environments.
3. Complete authenticated staging journeys against isolated PostgreSQL: registration/login/revocation, ownership and branch isolation, order reservation/cancellation, prescription approval/partial dispensing/substitution/reversal and audit reconciliation.
4. Verify an independent backup restore, migration rehearsal, rollback and monitoring. Existing migrations start from a legacy schema; this pass does not certify empty-database bootstrap.
5. Configure SMTP credentials and verified sender, then perform an explicitly authorized real delivery test. Implement and certify mobile-money/card providers before offering online payment; SMS remains unavailable.
6. Resolve durable notification queue/opt-out state, distributed rate limiting and scheduler execution for the chosen production hosting model. Current process-local services do not become durable merely by using PostgreSQL for operational records.
7. Obtain accountable privacy, clinical-safety and applicable regulatory acceptance before real patient processing.

Production promotion and merge remain subject to these outstanding controls. This document records implementation and evidence, not unsupported completion.
