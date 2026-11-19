# Thandizo credential rotation — 19 November 2026

## Scope and authorization

The owner requested key rotation, then clarified that SUDERN and Thandizo are separate projects. All credential changes, database password resets, configuration writes and deployments in this operation are restricted to the current Thandizo Vercel project and its current Neon project. SUDERN received no password reset, environment change, database write or deployment.

No secret value, connection string, token, private key or password is included in this record.

## Completed changes

| Credential | Scope | Result |
| --- | --- | --- |
| Database role password | Thandizo isolated Preview, `steep-firefly-97657954 / br-winter-glitter-zawsxmfl` | Reset; replacement connection succeeds; previous password receives an explicit password-authentication failure |
| Database role password | Thandizo current main database, `steep-firefly-97657954 / br-frosty-lab-zay0as5x` | Reset; replacement connection succeeds; previous password receives an explicit password-authentication failure |
| JWT signing secret | Preview and production, separate values | Replaced with independent 512-bit random secrets; deployed runtimes refreshed |
| Session secret | Thandizo Preview/production configuration | Replaced with a fresh 512-bit random value |
| Patient-data encryption key | Preview and production, separate values | Replaced with independent 512-bit random values after confirming both current audit tables contained zero encrypted records |
| Database configuration | Thandizo only | Existing connection/password aliases refreshed; independent sensitive `THANDIZO_DATABASE_URL` bindings installed with explicit environment/branch scope |

The source uses the encryption helper for audit changes. Read-only checks found zero audit events and zero encrypted audit payloads in both current databases before rotation. User/password-hash records were not modified. This is not an inspection of external backups or a general data-compromise assessment.

New secret values remain in Neon and Vercel secret storage. They were not added to Git, reports, local environment files or chat output. External SMTP, payment and OIDC-provider credentials were not reset.

## Deployment recovery

The first attempt to refresh the previous production deployment retained a legacy build command, `npm run db:migrate && npm run build`. It failed with PostgreSQL `28P01` before acquiring its migration lock or applying a migration. A later read-only check found the existing 12 migration ledger entries and zero audit events.

Production maintenance is isolated on `agent/thandizo-key-rotation-20261119` at `e5e8ad3d8156b9df0f259d1250819a47938af7d4`, based on the previous production commit `7bd05f1b5a350ccbd9f9ce3a9dc6144159df111d`. The comparison contains exactly two one-line functional changes:

1. `vercel.json`: build the application without automatically executing migrations.
2. `server/db.ts`: prefer the explicitly rotated Thandizo connection, then `DATABASE_URL`, then the provider-managed legacy alias.

No broader public-site, forecasting, clinical or workflow feature change was promoted to production. No mainline merge was performed. Failed intermediate deployments are not release candidates.

Any rollback must retain the replacement secrets and explicit database binding. Do not restore a retired password or roll traffic back to an immutable deployment carrying stale credentials.

| Deployment | Exact source | Result |
| --- | --- | --- |
| Refreshed public/forecasting Preview, `dpl_B4suRBPyzbvhy7WiYuMG6fjddRtG` | `067367a313f7c8b5783c9341a2f984801b60b110` | READY; health/readiness HTTP 200 |
| Credential-only production maintenance, `dpl_EadEDqoD7xhE1NGda3okaogWgiNX` | `e5e8ad3d8156b9df0f259d1250819a47938af7d4` | READY; readiness HTTP 200; catalogue database read HTTP 200 |
| Existing production alias | Maintenance deployment | Readiness HTTP 200 |

The release branch also carries the same explicit connection precedence in the shared API/migration resolver, preventing a later feature release from restoring the stale-alias selection behavior.

## Verification

- Before reset, the retired Thandizo connection strings connected successfully.
- After reset, the same endpoints and test query rejected the previous passwords with password-authentication errors. Replacements connected successfully. Tests used secret-safe stdin with terminal echo disabled; no credential values were written to disk or emitted in results.
- Both scopes have distinct application signing/encryption values. Production and Preview configuration metadata recorded the writes; sensitive values cannot be read back through the connector.
- Preview health/readiness, production readiness, production catalogue read and production-alias readiness passed. This does not certify authenticated prescribing, dispensing, recovery or all business journeys.
- The release-branch resolver update passed TypeScript, 70 automated tests, 12-file migration validation, the 97-route register and the production build.
- GitHub Actions secrets and local workstation copies were not accessible for verification; the available GitHub CLI was not authenticated. No claim is made that external/local copies were synchronized.

## Historical credential finding remains open

The historical password exposed in Thandizo's public default-branch environment file belongs to an older Neon project, not the current Thandizo databases. Read-only checks showed that the same password is accepted on that older project's main branch and three SUDERN branches. The owner clarified the application separation before any mutation of those resources, so those credentials and consumers were left unchanged.

**Current Thandizo rotation is complete; historical cross-project credential revocation is not complete.** Do not mark the public-history incident closed or assume that removal of a file revokes a password. Any separate SUDERN revocation must inventory its consumers and update its own secret bindings without changing Thandizo's database selection.

Security-log review, access-history assessment, independently verified backup restoration, credential-history remediation, executed CI and accountable clinical/privacy/production acceptance remain separate work. This rotation does not grant general production authorization.
