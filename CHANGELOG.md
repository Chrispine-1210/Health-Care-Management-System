# Changelog

All notable changes are recorded here. The project follows [Semantic Versioning](https://semver.org/) once release tags begin.

## Unreleased

### Added

- Transactional inventory reservation, dispensing, substitution and reversal workflows.
- Quarantine handling for medicine returned through dispensing reversal.
- Persistent emergency-access grants, immutable audit controls and authorization regression tests.
- Route-security and migration validation scripts.
- GitHub quality, dependency, CodeQL, secret-scanning, migration and release workflows.
- Project governance, quality-gate, release and security documentation.
- Responsive public pharmacy site, searchable catalogue, branch directory, help, privacy information and published article workflow.
- Advisory Gamma–Poisson inventory forecasting with discrete prediction intervals, stockout probabilities, input-quality checks and rolling backtests.
- Process-local error-rate observations with Wilson uncertainty intervals and bounded read retry policy.

### Changed

- Production authentication, authorization, logging, patient-data encryption and deployment defaults were hardened.
- Vercel builds no longer apply database migrations automatically.
- Repository documentation now distinguishes implemented PWA support from unimplemented native mobile packaging and avoids unsupported compliance claims.

### Security

- Removed tracked environment configuration from the active hardening branch.
- Added secret scanning, dependency review and CodeQL analysis gates.
- Added explicit credential-rotation and private vulnerability-reporting procedures.
- Restricted draft/future article access, public branch metadata and branch inventory/reporting; bounded independent request-limit budgets and redacted application errors.
- Removed fabricated dashboard analytics, synthetic chat activity and timer-based AI security scan claims from active management surfaces.

## Release policy

Published entries will use `## [x.y.z] - YYYY-MM-DD`. Do not move changes out of **Unreleased** until the matching tag and GitHub release are created.

