# Security Policy

## Supported versions

Security fixes are applied to the default branch and the latest published release. No version is production-certified until a GitHub release is created and the release checklist is signed off.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Latest GitHub release | Yes |
| Older tags and unmerged branches | No |

## Reporting a vulnerability

Do not open a public issue containing exploit steps, credentials, patient information or other sensitive evidence.

1. Use GitHub's **Report a vulnerability** option under the repository Security tab when available.
2. If private vulnerability reporting is unavailable, contact the repository owner privately through the GitHub account before sharing technical details.
3. Include the affected version or commit, impact, safe reproduction steps and suggested mitigation. Use synthetic data and redact tokens, connection strings and health records.

Target response times are 24 hours for critical reports, three business days for high severity and five business days for other reports. These are triage targets, not a guarantee of remediation time.

## Severity model

- **Critical:** exposed production secret, unauthenticated patient-data access, privilege escalation, medication or inventory integrity compromise, or remote code execution.
- **High:** cross-tenant/branch access, durable audit bypass, payment tampering, unsafe dispensing path or high-impact dependency vulnerability.
- **Moderate:** limited information disclosure, denial of service with practical constraints, or missing defence in depth.
- **Low:** hardening opportunity with no demonstrated confidentiality, integrity or availability impact.

## Mandatory repository controls

- No `.env` files, credentials, private keys, production database exports or patient data in Git.
- Rotate a secret immediately if it may have entered a commit, log, issue, artifact or chat; deletion from the latest tree is not sufficient.
- Use independent values for authentication signing and patient-data encryption.
- Store deployment secrets in protected environments and restrict production access.
- Require quality, dependency, CodeQL and secret-scanning gates before merge.
- Review authorization, audit, inventory and migration changes as high-risk changes.
- Use synthetic fixtures in tests and screenshots.

## Healthcare data rules

- Apply least privilege and record ownership/branch checks on every sensitive endpoint.
- Do not log request/response bodies containing patient, prescription, credential or payment data.
- Encrypt sensitive fields at rest and TLS-protect data in transit.
- Preserve append-only audit evidence for clinical, inventory, financial and emergency-access actions.
- Define retention, deletion, backup and restore controls with legal and regulatory advisers before production use.

## Incident response

For a suspected incident:

1. Contain access and disable affected credentials or integrations.
2. Preserve relevant logs and audit evidence without copying patient data into GitHub.
3. Assess affected users, records, branches and time window.
4. Patch and validate in staging, including regression tests.
5. Complete required notifications and regulatory/legal review.
6. Document root cause, corrective actions and prevention controls.

Never rewrite shared Git history until all active credentials found in that history have been revoked and collaborators have been given a coordinated recovery plan.

## Compliance statement

Security controls in this repository are engineering measures, not proof of compliance. Production use requires independent review against applicable Malawi pharmacy, health-information, privacy, consumer-protection and payment requirements.

