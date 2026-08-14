# Quality and Release Gates

## Merge gates

Configure branch protection on `main` to require the following checks and at least one approving review:

| Gate | Workflow/check | Blocking condition |
| --- | --- | --- |
| Type safety | `Quality Gate / validate` | Any TypeScript error |
| Automated tests | `Quality Gate / validate` | Any test failure |
| Migration integrity | `Quality Gate / validate` | Missing, reordered or invalid migration |
| Route authorization register | `Quality Gate / validate` | Generated register differs from committed evidence |
| Production build | `Quality Gate / validate` | Client, service worker, server or Vercel adapter fails to build |
| Runtime dependencies | `Quality Gate / dependency-audit` | High/critical production vulnerability |
| Dependency changes | `Dependency Review` | New moderate-or-higher vulnerable dependency |
| Static analysis | `Security / CodeQL` | Unresolved blocking alert |
| Secret scanning | `Security / Secret scan` | Credential-like material detected |
| Deployment preview | Vercel | Preview build failure |

Recommended branch settings:

- Require pull requests and one approval.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution.
- Require branches to be up to date before merge.
- Block force pushes and branch deletion.
- Prefer squash merge for a readable release history.

## Healthcare change gates

Changes affecting patient, prescription, dispensing, inventory, payment or emergency-access state must also prove:

- Denied access for unauthenticated and unauthorized actors.
- Ownership and branch isolation.
- Idempotency where duplicate requests can cause harm.
- Transactional rollback when any write fails.
- Immutable audit evidence for success and denial/failure paths.
- Validation of quantities, state transitions and expiry rules.
- No patient or credential payloads in logs.

## Database migration gates

- Migration file names are ordered and immutable after release.
- Schema and code are backward-compatible for a rolling deployment, or downtime is explicitly approved.
- A current backup and tested restore path exist.
- Legacy-data validation/remediation is documented.
- The migration is tested against staging before production.
- Production execution uses the manual migration workflow with environment approval.

## Release gates

A tag may be created only when:

1. `main` is green and the release commit is approved.
2. `CHANGELOG.md` is complete and `package.json` contains the release version.
3. Open P0 issues are zero; P1 exceptions have written risk acceptance.
4. Credential rotation and secret-scanning obligations are complete.
5. Staging smoke tests cover authentication, authorization, prescriptions, stock, dispensing, reversals, payments and health probes.
6. Backup, migration, rollback, monitoring and on-call owners are named.
7. Required privacy, clinical and regulatory approvals are recorded.

## Production acceptance

During the release monitoring window verify:

- `/health` and `/ready` remain healthy.
- Error rate and latency remain within the approved baseline.
- Authentication failures, authorization denials and emergency access show expected patterns.
- Stock, reservation, dispensing and payment reconciliation remain balanced.
- No unexpected audit-log gaps or sensitive-data logging occur.

Any patient-safety, data-integrity or credential incident triggers rollback/containment and a P0 incident review.

