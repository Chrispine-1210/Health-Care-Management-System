# Contributing

Thandizo handles safety-sensitive healthcare workflows. Changes must be traceable, testable and reversible.

## Workflow

1. Start from an approved issue with priority, impact and acceptance criteria.
2. Branch from the intended base using `agent/<short-scope>`.
3. Keep changes focused; separate unrelated refactors from safety or security fixes.
4. Add or update automated tests for every behaviour change.
5. Run the local quality gates.
6. Open a draft pull request and complete the risk, data, migration and rollback sections.
7. Move the pull request out of draft only after required checks pass.

## Local gates

```bash
npm ci
npm run check
npm test
npm run migration:check
npm run route-security:check
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
```

## High-risk change requirements

The following changes require explicit threat/safety analysis and negative-path tests:

- Authentication, authorization, emergency access and role assignment.
- Patient, prescription, appointment or payment data.
- Inventory reservations, dispensing, reversals, substitutions and stock adjustments.
- Audit logs, encryption, secrets or security middleware.
- Database migrations, deployment configuration and service-worker caching.

For migrations, include compatibility, backup, rollback and legacy-data remediation notes. Never make a preview build mutate a production database.

## Data handling

- Use synthetic fixtures only.
- Never commit credentials, tokens, private keys, database dumps or `.env` files.
- Never include patient information in tests, screenshots, logs, issues or pull requests.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## Commit and pull-request quality

Use concise imperative commit messages, for example:

- `enforce branch scope on stock adjustments`
- `add controlled release workflow`
- `document dispensing rollback gate`

A pull request is complete only when its acceptance criteria, tests, documentation, migration plan and rollback plan agree with the implementation.

