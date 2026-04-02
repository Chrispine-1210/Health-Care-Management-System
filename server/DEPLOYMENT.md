# Deployment Guide - Thandizo Pharmacy

The app is **production-ready** and can be deployed to any Node.js hosting platform.

## Quick Deploy

### Prerequisites
- Node.js 18+
- npm/yarn
- PORT 5000

### Build & Deploy

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| NODE_ENV | Yes | Set to `production` |
| PORT | No | Port (default: 5000) |
| JWT_SECRET | Yes | Secret for JWT (must change) |
| LOG_LEVEL | No | debug/info/warn/error |
| DATABASE_URL | No | PostgreSQL connection |

## Deployment Options

**Railway**: `railway up`

**Heroku**: 
```bash
heroku create thandizo-pharmacy
git push heroku main
```

**Docker**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
```

**Fly.io**: `flyctl launch && flyctl deploy`

## Health Checks

- `GET /health` - Full health status
- `GET /ready` - Readiness probe

## Production Checklist

- [ ] Change JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS
- [ ] Set secure database URL
- [ ] Enable logging/monitoring
- [ ] Configure rate limits
- [ ] Backup database

## Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 5000
  initialDelaySeconds: 5
```

## Scaling

App is stateless and horizontally scalable:
- No server-side sessions (JWT on client)
- No sticky sessions required
- Health checks support auto-replacement
