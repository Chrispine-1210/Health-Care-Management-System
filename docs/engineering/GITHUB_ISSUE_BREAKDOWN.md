# Thandizo Pharmacy GitHub Engineering Breakdown

The following production issues map directly to the stabilization directive. Each item includes priority, impact, solution direction, acceptance criteria, dependencies, effort, and labels so it can be created as a GitHub issue or tracked in GitHub Projects.

## P0 - Critical / Immediate Risk

### 1. Harden authentication, sessions, and privileged registration
- **Priority tag:** P0
- **Problem statement:** Authentication accepted weak defaults, public registration could request privileged roles, and session validation did not enforce idle timeout on every protected request.
- **Impact analysis:** Patients face unauthorized exposure of personal health information; pharmacy staff risk account takeover; the system risks privileged API misuse.
- **Technical solution proposal:** Require strong production JWT secrets, use timing-safe token verification, restrict public registration to non-privileged roles, add admin-only user creation, enforce access-token session activity, and audit privileged actions.
- **Acceptance criteria:** Production boot fails without `JWT_SECRET`; public registration cannot create admin/pharmacist/staff users; inactive sessions are rejected; auth failures are logged without secrets.
- **Dependencies:** Environment secret management and admin onboarding workflow.
- **Estimated effort:** M
- **Labels:** security, backend, auth, audit, P0

### 2. Enforce RBAC on admin and sensitive operational APIs
- **Priority tag:** P0
- **Problem statement:** Sensitive routes must have explicit role gates and deny all unauthorized access paths.
- **Impact analysis:** Prevents unauthorized dispensing, inventory manipulation, clinical override abuse, and patient record access.
- **Technical solution proposal:** Apply `authenticateToken` and `requireRole` to privileged routes; add 403 logging; verify patient-owned preference changes.
- **Acceptance criteria:** Admin-only APIs reject non-admin users; pharmacist-only clinical APIs reject customers/drivers; access denials are logged.
- **Dependencies:** Auth middleware and role taxonomy.
- **Estimated effort:** M
- **Labels:** security, backend, RBAC, P0

### 3. Sanitize API input and secure headers
- **Priority tag:** P0
- **Problem statement:** User-controlled strings need centralized sanitization and responses need hardened browser security headers.
- **Impact analysis:** Reduces XSS and injection risk for patient, prescription, inventory, and admin workflows.
- **Technical solution proposal:** Add recursive request sanitization, rate limiting, CSP, HSTS, referrer policy, and disabled Express fingerprinting.
- **Acceptance criteria:** Request bodies, query strings, and params are sanitized; sensitive values are not mutated; all responses include security headers.
- **Dependencies:** Express middleware registration.
- **Estimated effort:** S
- **Labels:** security, backend, API, P0

### 4. Implement audit logging for sensitive actions
- **Priority tag:** P0
- **Problem statement:** Clinical overrides, order approvals, notification changes, and inventory scans must be traceable.
- **Impact analysis:** Supports patient safety investigations, regulatory review, operational accountability, and incident response.
- **Technical solution proposal:** Add reusable audit service and call it from sensitive route handlers.
- **Acceptance criteria:** Each sensitive operation records user, action, entity, IP, user agent, and changes; audit failures do not block patient-critical operations but are logged.
- **Dependencies:** Storage audit log API.
- **Estimated effort:** S
- **Labels:** audit, backend, security, P0

## P1 - High Impact

### 5. Build event-driven SMS and email notification engine
- **Priority tag:** P1
- **Problem statement:** Appointment, prescription, refill, inventory, queue, and system notifications need multi-channel delivery with retries.
- **Impact analysis:** Patients receive timely care updates; staff see critical stock alerts; admins receive system alerts.
- **Technical solution proposal:** Implement template registry, provider abstraction, queue, retry state, delivery logs, and opt-out management.
- **Acceptance criteria:** Staff can enqueue email/SMS jobs; delivery logs are queryable; opted-out patients are skipped; failed jobs retry up to configured max attempts.
- **Dependencies:** Email/SMS provider credentials for production.
- **Estimated effort:** L
- **Labels:** notifications, backend, patient-communication, P1

### 6. Add clinical drug interaction and allergy checking
- **Priority tag:** P1
- **Problem statement:** Prescription entry needs real-time interaction, contraindication, and allergy warnings before dispensing.
- **Impact analysis:** Reduces medication harm; helps pharmacists identify critical safety issues; supports justified overrides.
- **Technical solution proposal:** Add clinical decision support service, severity taxonomy, pharmacist override route, and audit logging.
- **Acceptance criteria:** API returns low/moderate/high/critical alerts; high/critical alerts require override; override requires justification and is audited.
- **Dependencies:** Future integration with a certified external drug database.
- **Estimated effort:** L
- **Labels:** clinical, patient-safety, backend, P1

### 7. Automate inventory alerts and reorder suggestions
- **Priority tag:** P1
- **Problem statement:** Stock risks must be detected through daily scans and real-time stock monitoring.
- **Impact analysis:** Prevents missed prescriptions due to stockouts; reduces expired/overstock losses; improves supplier planning.
- **Technical solution proposal:** Add inventory intelligence scanner for low stock, expiry windows, overstock, dashboard alerts, critical notifications, and reorder suggestions.
- **Acceptance criteria:** Scan identifies low stock and 30/15/7-day expiry alerts; critical alerts enqueue email/SMS; dashboard endpoint exposes alerts.
- **Dependencies:** Supplier metadata and scheduled job runner.
- **Estimated effort:** M
- **Labels:** inventory, backend, notifications, P1

### 8. Add performance optimization foundation
- **Priority tag:** P1
- **Problem statement:** Large datasets and heavy work need pagination, caching, and async background processing readiness.
- **Impact analysis:** Reduces downtime risk and improves staff workflow responsiveness during peak pharmacy operations.
- **Technical solution proposal:** Introduce queue-backed background operations, rate limiting, database indexes already present in schema, and control-center observability.
- **Acceptance criteria:** Heavy notification/inventory work is asynchronous; large operational views can be paginated in follow-up issue; readiness metrics are visible.
- **Dependencies:** Redis or durable queue for production.
- **Estimated effort:** L
- **Labels:** performance, backend, infra, P1

## P2 - Medium Priority / Optimization

### 9. Improve engineering control-center UX
- **Priority tag:** P2
- **Problem statement:** Operational readiness data needs a live dashboard UI, not only APIs.
- **Impact analysis:** Engineering and pharmacy leadership can quickly see blocked work, risks, and deployment readiness.
- **Technical solution proposal:** Build frontend views for priority progress, modules, risk heatmap, burndown, and weekly report.
- **Acceptance criteria:** Admin dashboard renders P0-P3 progress and module status; metrics refresh from `/api/engineering/control-center`.
- **Dependencies:** Existing dashboard shell and auth client.
- **Estimated effort:** M
- **Labels:** frontend, dashboard, reporting, P2

### 10. Expand reporting and workflow refinements
- **Priority tag:** P2
- **Problem statement:** Staff need clearer reports for notifications, inventory alert history, and clinical overrides.
- **Impact analysis:** Improves audit readiness, stock planning, and patient safety handoffs.
- **Technical solution proposal:** Add exportable reports and filters by module, branch, severity, date, and status.
- **Acceptance criteria:** Admins can filter and export operational logs; reports never expose secrets.
- **Dependencies:** Durable persistence for notification jobs and inventory alert snapshots.
- **Estimated effort:** M
- **Labels:** reporting, frontend, data, P2

## P3 - Enhancement / Future Scale

### 11. Integrate certified clinical drug database provider
- **Priority tag:** P3
- **Problem statement:** Static rule checks should be replaced or supplemented with a certified clinical API.
- **Impact analysis:** Improves clinical accuracy and pharmacist confidence at scale.
- **Technical solution proposal:** Add provider abstraction for drug interaction APIs with caching, fallback rules, monitoring, and contract tests.
- **Acceptance criteria:** API provider can be configured by environment; fallback rules activate during provider outage; responses include source metadata.
- **Dependencies:** Provider selection, procurement, clinical governance.
- **Estimated effort:** XL
- **Labels:** clinical, integrations, backend, P3

### 12. Add advanced forecasting and AI inventory analytics
- **Priority tag:** P3
- **Problem statement:** Reorder suggestions can mature into demand forecasting and supplier optimization.
- **Impact analysis:** Reduces stockouts, dead stock, and working-capital waste.
- **Technical solution proposal:** Add analytics models using sales velocity, seasonality, expiry risk, branch demand, and supplier lead times.
- **Acceptance criteria:** Forecasting model provides confidence scores and recommended reorder quantities; pharmacist/admin can approve or reject suggestions.
- **Dependencies:** Historical sales data, supplier lead-time data, governance controls.
- **Estimated effort:** XL
- **Labels:** analytics, AI, inventory, P3
