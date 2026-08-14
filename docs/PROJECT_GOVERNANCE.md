# Project Governance

## Objective

Deliver a safe, auditable and commercially deployable healthcare operations platform through controlled increments. Shipping more features is subordinate to protecting patient data, medicine integrity, financial integrity and operational continuity.

## Priority model

| Priority | Definition | Initial response | Release treatment |
| --- | --- | --- | --- |
| P0 | Active security exposure, patient-safety risk, data corruption or production outage | Immediate | Blocks all releases |
| P1 | High operational, revenue, compliance or reliability impact | Same business day | Must be resolved or formally risk-accepted |
| P2 | Material capability or maintainability improvement | Planned sprint | May ship in planned minor release |
| P3 | Enhancement, experiment or future scale | Backlog review | Does not block release |

## Project board states

Use a single GitHub Project with these states:

1. **Intake** — problem captured but not yet assessed.
2. **Triage** — priority, owner, risk and acceptance criteria being defined.
3. **Ready** — approved scope with dependencies and testable acceptance criteria.
4. **In progress** — implementation is active on a linked branch.
5. **Review** — draft pull request exists; quality/security gates are running.
6. **Release ready** — approved, documented and assigned to a target release.
7. **Done** — merged, released or explicitly closed with evidence.

Recommended project fields are Priority, Workstream, Risk, Target release, Owner, Status and Blocked by.

## Workstreams

- Security and identity
- Patient and clinical workflows
- Inventory and dispensing
- Orders, payments and delivery
- Data, migrations and audit
- Platform, reliability and observability
- User experience and accessibility
- Compliance and operational readiness

## Work-item requirements

Every issue must contain:

- A concrete problem statement and affected users.
- Patient, operational, security, data and financial impact.
- Scope and explicit non-goals.
- Measurable acceptance criteria.
- Dependencies and migration implications.
- Test strategy, telemetry and rollback plan.
- Priority and accountable owner.

## Decision rights

- The repository owner approves scope, release timing and accepted business risk.
- A qualified pharmacist or clinical reviewer approves changes affecting dispensing or clinical decision support.
- A security reviewer approves authentication, authorization, encryption and sensitive logging changes.
- A data owner approves destructive or irreversible database operations.

One person may hold multiple roles in early-stage delivery, but the approval evidence must still be recorded.

## Definition of ready

A work item is ready when the problem, priority, dependencies, acceptance criteria, data impact and reviewer are known. Unknown clinical or regulatory requirements block implementation rather than becoming developer assumptions.

## Definition of done

A work item is done only when:

- Acceptance criteria are demonstrably met.
- Positive, negative, authorization and rollback paths are tested as applicable.
- Type checking, tests, build, migration and route-security gates pass.
- Documentation and operational runbooks are updated.
- No secrets or real patient data entered the change set.
- Observability and audit evidence exist for sensitive operations.
- The pull request is reviewed and linked to its issue/release.

## Release governance

- Use patch releases for compatible fixes, minor releases for compatible capabilities and major releases for breaking contracts or irreversible migrations.
- Keep production deployments separate from database migration execution.
- Require protected GitHub Environments named `staging` and `production`, with production approval and environment-scoped secrets.
- Record release owner, migration owner, rollback authority and monitoring window for every production release.

