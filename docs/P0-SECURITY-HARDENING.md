# Critical Security Hardening Implementation

**Priority**: P0 - IMMEDIATE EXECUTION  
**Status**: Ready for Implementation  
**Timeline**: This Week

---

## 1. Password Hashing Migration (SHA256 → Bcrypt)

### Current Vulnerability
```typescript
// VULNERABLE - SHA256 with salt
const passwordHash = crypto
  .createHash('sha256')
  .update(password + salt)
  .digest('hex');
```

### Implementation

**Step 1: Add bcrypt dependency**
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Step 2: Create auth utility**
```typescript
// server/security/passwordUtil.ts
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

**Step 3: Update authentication endpoints**
```typescript
// server/routes.ts - Login endpoint
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.users.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // NEW: Use bcrypt verification
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token...
});

// Signup endpoint
router.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  
  // NEW: Use bcrypt hashing
  const hashedPassword = await hashPassword(password);
  
  const user = await db.users.create({
    email,
    passwordHash: hashedPassword
  });
  
  res.json(user);
});
```

**Step 4: Migrate existing passwords**
```typescript
// server/scripts/migratePasswords.ts
import { db } from '../storage';
import { hashPassword } from '../security/passwordUtil';

const migratePasswords = async () => {
  const users = await db.users.all();
  let migrated = 0;
  let failed = 0;
  
  for (const user of users) {
    try {
      // Check if already bcrypt hashed (starts with $2)
      if (user.passwordHash?.startsWith('$2')) {
        console.log(`User ${user.id} already migrated`);
        continue;
      }
      
      // Re-hash with bcrypt (password field may not be available)
      // For existing hashes, we'll require password reset
      user.passwordHash = 'reset-required';
      user.passwordResetRequired = true;
      
      await db.users.update(user.id, user);
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate user ${user.id}:`, error);
      failed++;
    }
  }
  
  console.log(`✓ Migrated: ${migrated}, Failed: ${failed}`);
};

migratePasswords().catch(console.error);
```

**Step 5: Force password reset on login**
```typescript
router.post('/api/login', async (req, res) => {
  const user = await db.users.findOne({ email: req.body.email });
  
  if (user.passwordResetRequired) {
    return res.status(403).json({
      error: 'Password reset required',
      code: 'PASSWORD_RESET_REQUIRED',
      resetToken: generateResetToken(user.id)
    });
  }
  
  // ... continue with login
});
```

---

## 2. Security Headers Implementation

```typescript
// server/middleware/securityHeaders.ts
import { Express, Request, Response, NextFunction } from 'express';

export const securityHeaders = (app: Express) => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HSTS - Force HTTPS for 1 year
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.drugbank.ca",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    );
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );
    
    // Disable feature policy
    res.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none';");
    
    next();
  });
};
```

**Apply in server**
```typescript
// server/index.ts
import { securityHeaders } from './middleware/securityHeaders';

const app = express();

securityHeaders(app);

// ... rest of app setup
```

---

## 3. Encryption at Rest Implementation

```typescript
// server/security/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'default-dev-key')
  .digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export const encryptField = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv + authTag + ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decryptField = (encrypted: string): string => {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
};
```

**Apply to sensitive fields**
```typescript
// server/routes.ts - When storing patient data
router.post('/api/patients', async (req, res) => {
  const { email, phone, medicalHistory } = req.body;
  
  const patient = await db.users.create({
    email: encryptField(email), // Encrypt SSN-like data
    phone: encryptField(phone),
    // Store encrypted medical info
    allergies: req.body.allergies?.map(a => encryptField(a)),
    chronicConditions: req.body.conditions?.map(c => encryptField(c))
  });
  
  res.json(patient);
});
```

---

## 4. Input Validation & Sanitization

```typescript
// server/middleware/validation.ts
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

export const validatePrescription = [
  body('patientId').isUUID(),
  body('fileUrl').isURL(),
  body('reviewNotes')
    .optional()
    .trim()
    .escape()
    .custom((value) => {
      const clean = DOMPurify.sanitize(value);
      if (clean !== value) {
        throw new Error('Input contains malicious content');
      }
      return true;
    }),
  body('prescribedMedications').isArray(),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.param,
        message: e.msg
      }))
    });
  }
  next();
};
```

---

## 5. Session Management & Token Rotation

```typescript
// server/security/sessionManager.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateTokenPair = (userId: string, role: string): TokenPair => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
};

export const refreshAccessToken = (refreshToken: string): string => {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as any;
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    const user = db.users.findOne({ id: payload.userId });
    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
```

---

## 6. Comprehensive Audit Logging

```typescript
// server/middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  status: 'success' | 'failure';
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export const logAudit = async (entry: AuditLogEntry) => {
  // Immutable append to audit log
  await db.auditLogs.create(entry);
  
  // Critical actions: also log to separate system log
  if (['DELETE', 'APPROVE', 'DISPENSE'].includes(entry.action)) {
    console.log(
      `[AUDIT] ${entry.action} | User: ${entry.userId} | Entity: ${entry.entityType}:${entry.entityId}`
    );
  }
};

export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Log after response is sent
    setImmediate(() => {
      if (requiresAudit(req)) {
        logAudit({
          userId: req.user?.id,
          action: `${req.method} ${req.path}`,
          entityType: extractEntityType(req),
          entityId: extractEntityId(req),
          status: res.statusCode < 400 ? 'success' : 'failure',
          ipAddress: req.ip!,
          userAgent: req.headers['user-agent']!,
          timestamp: new Date()
        });
      }
    });
    
    return originalJson(data);
  };
  
  next();
};

function requiresAudit(req: Request): boolean {
  return [
    'POST',
    'PUT',
    'DELETE'
  ].includes(req.method) && [
    '/api/prescriptions',
    '/api/orders',
    '/api/users',
    '/api/inventory'
  ].some(path => req.path.includes(path));
}
```

---

## Deployment Checklist

- [ ] Bcrypt integrated and tested
- [ ] All existing passwords migrated or reset required
- [ ] Security headers verified with browser tools
- [ ] Encryption key securely managed (env variable, not committed)
- [ ] Input validation on all endpoints
- [ ] Audit logging working for all sensitive operations
- [ ] Session timeout tested (idle logout at 15 min)
- [ ] Refresh token rotation working
- [ ] All tests passing
- [ ] Security review completed
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Monitor for 24 hours

