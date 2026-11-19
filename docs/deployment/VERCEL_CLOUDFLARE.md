# Thandizo Healthcare Production Deployment Runbook

This runbook is the production checklist for deploying the Thandizo Healthcare web application to its custom domain using Vercel for the frontend and Cloudflare for DNS, TLS, and edge security.

## 1. Deployment architecture

```text
User browser
  -> Cloudflare DNS, TLS, WAF, CDN
  -> Vercel static web app (dist/public)
  -> Backend API host configured by VITE_API_BASE_URL
```

The Vercel deployment serves the React/PWA frontend. API calls are intentionally configurable with `VITE_API_BASE_URL` so the browser can call a secure Express API host instead of hitting Vercel `/api` routes that do not exist for this server-based application.

## 2. Required environment variables

Set these variables before promoting a production deployment.

### Vercel frontend

| Variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://api.<your-domain>` or the HTTPS URL of the hosted Express backend |

### Backend API host

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Managed by the host, or `5000` for a VM/container |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `JWT_SECRET` | Long random secret stored only in the deployment platform |
| `FRONTEND_URL` | `https://<your-domain>` |
| `ALLOWED_ORIGINS` | `https://<your-domain>,https://www.<your-domain>` |
| `SMTP_*` | Production SMTP credentials if email is enabled |
| `PAYMENT_API_KEY` | Production payment provider credential if mobile money/card flows are enabled |

## 3. Vercel setup

1. Import the Git repository in Vercel.
2. Use the included project settings:
   - Build command: `npm run build`
   - Output directory: `dist/public`
3. Add `VITE_API_BASE_URL` in **Project Settings -> Environment Variables**.
4. Deploy Preview, then Production.
5. Validate these URLs after deploy:
   - `/` returns the landing page.
   - `/login` returns the SPA page, not a Vercel `NOT_FOUND` page.
   - `/service-worker.js` returns JavaScript with `Cache-Control: no-cache, no-store, must-revalidate`.
   - Browser network calls go to the configured `VITE_API_BASE_URL` host.

## 4. Cloudflare custom domain setup

1. Add the domain to Cloudflare and update the registrar nameservers to the Cloudflare nameservers.
2. In **DNS**, create records:

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| `CNAME` | `@` or root flattening record | Vercel-assigned target | Proxied |
| `CNAME` | `www` | Vercel-assigned target | Proxied |
| `CNAME` | `api` | Backend API host target | Proxied or DNS-only, depending on backend provider support |

3. In Vercel, add the custom domain and follow Vercel's domain verification prompt.
4. In Cloudflare **SSL/TLS**, use **Full (strict)** once the origin has a valid certificate.
5. Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.

## 5. Cloudflare security baseline

Apply these controls before go-live:

- WAF managed rules enabled.
- Rate limiting for sensitive paths:
  - `/login`
  - `/sign-in`
  - `/api/auth/*`
  - `/api/*prescription*`
- Cache rule: bypass cache for `/api/*`.
- Cache rule: cache static assets under `/assets/*` aggressively.
- Bot Fight Mode or equivalent bot protection enabled.
- Security level at least **Medium**.
- HSTS enabled only after confirming HTTPS works for the root, `www`, and `api` hostnames.

## 6. Quality-of-service checks

Run these checks for every production release:

```bash
npm ci
npm run check
npm run build
curl -I https://<your-domain>/
curl -I https://<your-domain>/service-worker.js
curl https://api.<your-domain>/health
curl https://api.<your-domain>/ready
```

Expected results:

- TypeScript check passes.
- Build produces `dist/public/index.html` and `dist/public/service-worker.js`.
- SPA routes return the app shell.
- Asset misses do not return server bundle code.
- API health and readiness endpoints return JSON.
- Cloudflare shows HTTPS with a valid certificate.

## 7. Go-live rollback plan

1. Keep the previous Vercel production deployment available.
2. If users see 404s or blank pages, immediately roll back in Vercel.
3. If API calls fail, verify `VITE_API_BASE_URL`, `ALLOWED_ORIGINS`, and Cloudflare cache bypass rules for `/api/*`.
4. If the browser displays old content, unregister the service worker in DevTools or deploy a new `service-worker.js` version.
