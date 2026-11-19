# Release Process

## Versioning

Use Semantic Versioning:

- **Patch (`x.y.Z`)** — compatible defect, security or documentation correction.
- **Minor (`x.Y.0`)** — compatible operational capability or workflow extension.
- **Major (`X.0.0`)** — breaking API/data contract, role model change or migration requiring coordinated cutover.

Pre-release tags such as `v1.2.0-rc.1` may be used for staging, but the automated stable release workflow accepts `vX.Y.Z` tags.

## Release preparation

1. Confirm the target scope and close or defer linked issues explicitly.
2. Update `CHANGELOG.md` and move shipped entries out of **Unreleased**.
3. Set `package.json` to the target version and refresh the lockfile when required.
4. Run all merge and healthcare gates in [QUALITY_GATES.md](QUALITY_GATES.md).
5. Deploy the release commit to staging and complete the smoke-test record.
6. Confirm backup/restore evidence, migration owner, rollback owner and monitoring window.
7. Merge the approved release pull request to `main`.

## Publishing

Create and push an annotated version tag matching `package.json`:

```bash
git switch main
git pull --ff-only
git tag -a v1.0.0 -m "Thandizo v1.0.0"
git push origin v1.0.0
```

The release workflow re-runs validation, builds a deployment bundle, generates a SHA-256 checksum and creates GitHub release notes. A release artifact is not a production deployment approval.

## Database migration

Database migrations are deliberately separated from builds and releases.

1. Open **Actions → Controlled Database Migration → Run workflow**.
2. Select `staging`, enter `migrate-staging`, and run.
3. Validate data integrity and application smoke tests.
4. Obtain the required production-environment approval.
5. Select `production`, enter `migrate-production`, and run once.

The protected environment must provide `DATABASE_URL`. Do not put it in workflow files, repository variables, artifacts or logs.

## Deployment order

For backward-compatible releases:

1. Apply additive migration.
2. Deploy application instances.
3. Validate health/readiness and business invariants.
4. Enable any gated capability.
5. Monitor and reconcile.

Breaking migrations require a separately reviewed expand/migrate/contract plan and may require a maintenance window.

## Rollback

- Prefer application rollback to the previous immutable artifact.
- Do not reverse a migration automatically when it could discard new records.
- For data incidents, contain writes, preserve audit evidence and execute the reviewed data-recovery plan.
- Document the incident, impact, decision authority and corrective action before resuming rollout.

## Post-release

- Confirm release health and readiness.
- Reconcile orders, payments, reservations, dispensing and stock ledgers.
- Review security and error telemetry.
- Close the release milestone and record follow-up work.
- Publish a patch release for corrective changes; never modify an existing release artifact in place.

