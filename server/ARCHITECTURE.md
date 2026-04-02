# Thandizo Pharmacy - System Architecture

## Overview
Production-ready healthcare management system with 5 role-based interfaces, JWT authentication, and comprehensive security.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Authentication**: JWT (Node.js crypto)
- **Storage**: In-memory (development), PostgreSQL (production-ready)
- **Security**: Rate limiting, CORS headers, input validation

## Directory Structure

### Server (`/server`)
- `index.ts` - Express app initialization
- `routes.ts` - API endpoint definitions
- `simpleAuth.ts` - JWT authentication
- `security.ts` - Rate limiting, input sanitization, password hashing
- `logger.ts` - Structured logging system
- `validation.ts` - Zod input validation schemas
- `errorHandler.ts` - Global error handling
- `userService.ts` - User business logic (SOLID)
- `healthCheck.ts` - Health/readiness endpoints
- `responseOptimizer.ts` - Caching and response optimization
- `envValidator.ts` - Environment variable validation

### Client (`/client/src`)
- `pages/` - 113 route pages across 5 roles
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `services/api.ts` - Centralized API client
- `lib/queryClient.ts` - TanStack Query setup
- `types/api.ts` - TypeScript API types
- `utils/performance.ts` - Performance monitoring
- `constants/roles.ts` - RBAC definitions

## Authentication Flow

1. User logs in with email/password
2. Server validates credentials
3. JWT token generated
4. Token stored in localStorage
5. All API requests include `Authorization: Bearer <token>` header
6. Server verifies token signature on protected routes

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schemas for all inputs
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, etc.
- **Password Hashing**: SHA256 with salt (production: use bcrypt)
- **CORS Protection**: Origin validation
- **Error Handling**: No sensitive info in error messages

## API Endpoints

### Health
- `GET /health` - Server health status
- `GET /ready` - Readiness probe

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `GET /api/auth/user` - Current user (protected)
- `POST /api/logout` - Logout

### Business (60+ endpoints)
- Products, Orders, Prescriptions, Deliveries, etc.
- All protected by JWT token

## Performance Optimizations

- Cache headers for GET requests (1 hour TTL)
- Request logging with timing metrics
- Performance monitoring utilities
- Lazy loading on frontend
- Response optimization middleware

## Monitoring

- Structured logging at DEBUG, INFO, WARN, ERROR levels
- Performance metrics tracking
- Health check endpoints
- Error tracking with context

## Deployment Ready

- Environment variable validation
- Health check endpoints for orchestration
- Rate limiting for DDoS protection
- Comprehensive error handling
- Production-grade logging

## Future Enhancements

1. PostgreSQL with Drizzle ORM
2. Redis caching layer
3. Advanced RBAC with permissions
4. API versioning
5. Webhook support
6. SMS/Email notifications
7. Analytics and reporting
