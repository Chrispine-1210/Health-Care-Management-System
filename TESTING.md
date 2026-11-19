# Testing Guide

Use synthetic data only. There are no shared “any password” demo accounts in production code, and credentials must never be documented in this repository.

## Automated validation

```bash
npm ci
npm run check
npm test
npm run migration:check
npm run route-security:check
npm run build
npm audit --omit=dev --audit-level=high
```

The test suite covers authorization boundaries, persistent authentication, emergency access, audit behaviour, transaction rollback, inventory reservations, prescription dispensing, batch substitution, dispensing reversal and payment handling.

## Test categories

### Authentication and authorization

- Missing, invalid, expired and revoked tokens return the correct denial.
- Public registration cannot create privileged roles.
- Role assignment follows the role hierarchy.
- Patient, order, appointment, delivery, payment and notification access respects ownership and permissions.
- Cross-branch and cross-patient access is denied.
- Emergency access is justified, time-limited and audited.

### Inventory and dispensing

- Reservations cannot exceed saleable stock.
- Concurrent operations preserve quantity invariants.
- Dispensing is idempotent and linked to a valid reservation/prescription decision.
- Batch substitution validates branch, product, expiry and quantity.
- Reversal returns medication to quarantine, not saleable stock.
- Partial failure rolls back all related writes.

### Data and audit

- Ordered migrations validate and do not silently mutate released files.
- Sensitive state transitions emit immutable audit records.
- Logs exclude tokens, passwords, connection strings and patient payloads.
- Database-backed tests use an isolated disposable database, never staging or production.

### Client and PWA

- Critical role journeys work on supported desktop and mobile browsers.
- Offline behaviour never exposes cached patient or API responses.
- Service-worker upgrades remove obsolete caches.
- Accessibility, form validation and error recovery are verified.

## Manual staging smoke test

1. Confirm `/health` returns a healthy process result.
2. Confirm `/ready` succeeds with the staging database and fails safely when a required dependency is unavailable.
3. Validate login/logout and one denied access path per role.
4. Create a synthetic prescription order, reserve stock, approve, dispense and reconcile the ledger.
5. Reverse a synthetic dispensing event and confirm quarantine stock plus audit evidence.
6. Exercise payment failure and retry without duplicate charging.
7. Review logs for correlation IDs and absence of sensitive bodies.

Record commit SHA, environment, tester, timestamp and evidence for every release candidate.

## Performance testing

Run load tests only against an isolated environment with synthetic records. Model authentication, product search, order placement, prescription queues and readiness checks separately. Define pass/fail thresholds before testing; raw request volume without latency and error budgets is not an acceptance criterion.

## Security testing

- Run CodeQL, dependency review, npm audit and secret scanning in GitHub Actions.
- Test IDOR/BOLA, privilege escalation, injection, replay/idempotency and file-upload abuse where applicable.
- Complete an independent penetration test before production use with real patient or payment data.

