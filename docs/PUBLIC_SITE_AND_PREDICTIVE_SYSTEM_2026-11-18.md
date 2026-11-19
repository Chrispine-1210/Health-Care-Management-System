# Public site, inventory prediction and reliability — 18 November 2026

## Delivered scope

The public experience now has a responsive home page, services, searchable/category-filtered catalogue, active branch directory, about page, help, privacy information, preview service terms, published updates and article pages. Sign-in and registration use the same visual identity, explicit labels and appropriate credential autocomplete. Unknown contacts, operating hours, licensing, outcomes and service coverage are not invented. The site identifies itself as a preview and excludes indexing until operator acceptance. Existing supplied imagery is explicitly illustrative.

The content workspace creates, edits, publishes and archives plain-text articles. Public APIs return only published, dated, non-future articles and omit author identifiers. A separate authenticated content endpoint returns drafts to permitted editors. Public branch responses omit manager IDs and licence metadata. The new public catalogue omits inactive, controlled and online-restricted items. These are publication controls, not proof of regulatory approval.

Private pages load on demand. Role-specific views and point of sale have explicit client guards; server authorization remains authoritative. Synthetic chat activity and the timer-based “AI security audit” were removed from active dashboard surfaces. The operational analytics page no longer presents fabricated weekly trends, growth or satisfaction. Branch reporting excludes system totals that cannot be scoped reliably and marks them unknown.

## Non-clinical prediction

`shared/predictive.ts` implements an inspectable statistical baseline. It is not a trained general-purpose AI, a diagnosis model or a clinically validated decision system. It makes no treatment or dispensing decisions and does not place orders.

For complete daily unit counts \(y_1,\ldots,y_n\), use a Gamma prior in shape/rate form:

\[
\lambda\sim\operatorname{Gamma}(1,1),\quad y_t\mid\lambda\sim\operatorname{Poisson}(\lambda).
\]

The posterior and demand distribution over fixed lead time \(h\) days are:

\[
\alpha=1+\sum y_t,\quad\beta=1+n,\quad
D_h\mid y\sim\operatorname{NB}\left(\alpha,p=\frac{\beta}{\beta+h}\right).
\]

\[
E[D_h]=\frac{h\alpha}{\beta},\quad
\operatorname{Var}(D_h)=\frac{h\alpha}{\beta}+\frac{h^2\alpha}{\beta^2}.
\]

For unreserved eligible stock \(s\), stockout means \(D_h>s\), not equality:

\[
P(D_h>s)=1-I_p(\alpha,s+1),\quad
Q_q=\min\{k\in\mathbb N_0:F_{NB}(k)\ge q\}.
\]

The complementary beta integral is evaluated directly for the tail to reduce cancellation. Quantiles use bounded continued fractions and discrete bisection, not a normal approximation. Numerical non-convergence raises an error; it never produces a successful prediction. A central 90% predictive interval and a separately configured service quantile (default 95%) are different quantities.

The prior contributes one unit over one day; it is disclosed in the response. Inputs require 14–365 complete daily counts, bounded non-negative integers, 1–90 lead days and service probability 0.8–0.999. Short histories, no positive observations, variance/mean greater than two, a material first-half/second-half shift, or weak rolling coverage flag professional review. Rolling one-day backtests train only on earlier counts and report MAE and empirical interval coverage; they do not establish external validation.

### Ledger evidence boundary

`GET /api/inventory/forecast` requires inventory permission and an assigned branch, except system administrators. Database queries constrain product, branch and observation dates and cap interactive processing at 20,000 movements. Only completed Africa/Blantyre days are included. Reservations, returns and transfers are not counted as demand. Active, unexpired, unreserved stock is available; quarantine is excluded.

Recorded dispensing is a censored proxy for demand. A missing entry cannot prove a completed zero-demand observation. The response therefore marks ledger coverage unverified and always withholds a live reorder suggestion. With fewer than 14 completed days since first available ledger evidence, it returns no forecast. No patient, prescriber, order, movement or clinical identifiers are returned in the forecasting response.

`POST /api/inventory/forecast-scenario` accepts only aggregate counts and bounded planning inputs. It is inventory-permission protected, identifies its data as user supplied and marks it as unverified business evidence. A provisional scenario can show a suggested mathematical reorder; neither endpoint writes stock or permits automation.

### Validation before model expansion

Establish durable daily capture, in-stock exposure, unmet demand, historical prices/promotions, actual supplier lead times and procurement constraints. Then compare seasonal/intermittent-demand challengers using time-separated backtests, pinball loss, MAE, calibration, inventory service levels and expiry waste. Use an operator-approved baseline, model version, drift thresholds and disable switch. Do not label greater model complexity as demonstrated accuracy.

## Failure handling and security

- Independent bounded per-process rate-limit budgets prevent path changes from resetting a budget. Denials include Retry-After and remaining-budget headers. At capacity, new identities fail closed rather than evicting existing limit records. This does not replace distributed edge limits.
- HTTP reads have ten-second fetch deadlines and at most two retries for network failures or 408/429/502/503/504. Exponential full jitter is \(U(0,\min(2000,250\cdot2^a))\) milliseconds. Retry-After is honored up to 60 seconds. Mutations are not automatically retried.
- Authentication middleware forwards storage failures to Express error handling. Errors return generic status/code and a request reference; unhandled payloads are not logged or rendered. Invalid JSON and oversized bodies return 400/413.
- Node and Vercel both record a bounded, process-local rolling request window. No paths, identities or payloads are retained. The privileged reliability endpoint reports observed 5xx counts, authorization denials, rate-limit responses, p95 latency and an error-proportion Wilson interval.
- Database pool size is bounded; Vercel defaults to three connections per process unless explicitly configured. Connection, query and statement deadlines are finite. Aggregate fleet connection capacity still requires measurement and provider sizing.
- Inventory scans are branch scoped for branch actors, include every expiry day within 30 days and already expired active stock, and do not count expired stock as available. Alert email requires an explicitly configured recipient. Timers run only in persistent Node and are not durable schedules.
- Browser/CDN no-store API rules, private-data offline-cache exclusions, controlled dispensing and return quarantine from the previous hardening pass are retained. Static hosting now supplies a CSP as well as existing security headers.

## Error-rate uncertainty

For observed server errors \(x\) over \(N\) requests, \(\hat p=x/N\), \(z=1.959963984540054\):

\[
L,U=\frac{\hat p+z^2/(2N)\ \mp\ z\sqrt{\hat p(1-\hat p)/N+z^2/(4N^2)}}{1+z^2/N}.
\]

With no observations the rate is unknown and the interval is [0,1]. Zero observed failures is not a 100% reliability claim. The process monitor does not establish fleet uptime. Wilson coverage assumes independent, stationary outcomes; incident-correlated requests can invalidate that interpretation. Under 100 observations is explicitly insufficient evidence. A lower bound above 1% is an investigation signal, not an automatic authorization or treatment decision.

## Infrastructure still requiring operational proof

| Control | Current boundary | Required completion evidence |
| --- | --- | --- |
| Credential incident | Prior public history contains credentials; this change cannot revoke them | Owner-approved inventory, rotation, rejection of old values, access review and encryption-key continuity |
| Distributed security | Limits and reliability observations are process local | Provider/Redis/PostgreSQL distributed enforcement, trusted proxy configuration and multi-instance denial tests |
| Notifications & schedules | Queue/opt-out state and timer are not durable fleet services | Durable outbox, unique event keys, worker leases, bounded retries, dead-letter recovery and actual delivery acknowledgement |
| Forecast validity | Conditional baseline; coverage unverified | Complete uncensored capture, held-out calibration and operator-approved use boundaries |
| Database recovery | No new migration; existing 12 migrations retained | Independent encrypted backup, empty-target restore, legacy bootstrap/migration rehearsal, measured RPO/RTO and rollback |
| Availability | Health/readiness probes and local telemetry | External fleet monitoring, latency/error objectives, alert owner, capacity/load tests and incident rehearsal |
| Production identity | Existing authentication retained; no new MFA claim | Credential revocation and MFA/session controls tested in the selected production runtime |
| Clinical safety | Automated planning cannot authorize clinical operations | Accountable pharmacy, privacy and applicable regulatory acceptance |

Production is not finalized by a successful build, a passing local suite or this document. Preview release and production authorization remain separate decisions.

## Mathematical references

- SciPy, negative binomial distribution: https://docs.scipy.org/doc/scipy/tutorial/stats/discrete_nbinom.html
- NIST, confidence intervals for a binomial proportion: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm

The regression suite compares probabilities and discrete quantiles with independently computed `scipy.stats.nbinom.cdf/ppf` reference values, including a multi-million shape case. Authorization tests use synthetic in-memory fixtures; they are not live PostgreSQL concurrency certification.

## Local verification for this revision

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| Automated suite | PASS — 70 tests |
| Migration integrity | PASS — 12 ordered files; no migration added or applied |
| Route authorization register | PASS — 97 registered routes |
| Production build | PASS — split client, service worker, Node server and Vercel adapter |
| Runtime dependency audit | PASS — zero known findings on 18 November 2026 |
| Public entry JavaScript | 343.04 kB uncompressed / 111.40 kB gzip in local build; imagery and CSS are additional |
| Provider/browser evidence | Record separately against the exact published commit; local tests do not prove deployed journeys |
