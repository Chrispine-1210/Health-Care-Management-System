# P0 Critical Issues - GitHub Issues Template

## Issue P0.1: Implement Bcrypt Password Hashing

**Priority**: P0 - CRITICAL  
**Type**: Security Vulnerability  
**Effort**: 16 hours  
**Timeline**: Week 1

```
Title: SECURITY: Migrate password hashing from SHA256 to bcrypt

Labels: security, critical, authentication, p0

Problem:
Current implementation uses SHA256 + salt for password hashing, which is cryptographically weak and vulnerable to rainbow table attacks. This is a critical patient data protection issue.

Impact:
- Patient Account Compromise Risk: HIGH
- Data Breach Risk: CRITICAL
- Compliance Risk: HIPAA/GDPR
- Regulatory: Reportable security incident if breached

Technical Details:
- Current: SHA256(password + salt) - weak, fast (bad for passwords)
- Recommended: Bcrypt with 12 rounds - strong, intentionally slow
- Migration Strategy: New hashes for new passwords, force reset for existing

Acceptance Criteria:
- [ ] Bcrypt (12 rounds) integrated for new password hashing
- [ ] All new user registrations use bcrypt
- [ ] All new password changes use bcrypt
- [ ] Existing users prompted to reset password on next login
- [ ] Password verification uses bcrypt comparison
- [ ] No plaintext passwords logged
- [ ] Migration script tested with production-like data
- [ ] 100% test coverage for password functions

Technical Solution:
1. Install bcrypt library
2. Create passwordUtil.ts with hash/verify functions
3. Update login endpoint to use bcrypt comparison
4. Update signup endpoint to use bcrypt hashing
5. Create migration script to mark existing passwords for reset
6. Update profile change password endpoint
7. Test all authentication flows

Dependencies:
- None (blocking) - can be implemented independently

Related Issues:
- P0.4: Comprehensive Audit Logging (needed to log password reset)

References:
- OWASP Password Storage Cheat Sheet
- CWE-327: Use of Broken Cryptography
```

---

## Issue P0.2: Security Headers Implementation

**Priority**: P0 - CRITICAL  
**Type**: Security Vulnerability  
**Effort**: 8 hours  
**Timeline**: Week 1

```
Title: SECURITY: Implement comprehensive security headers (CSP, HSTS, X-Frame-Options)

Labels: security, critical, infra, p0

Problem:
Missing security headers leave the application vulnerable to:
- Clickjacking attacks
- MIME type sniffing
- XSS attacks
- Man-in-the-middle attacks

This is critical for a healthcare application handling patient data.

Impact:
- XSS Attack Risk: HIGH
- Data Interception Risk: MEDIUM
- Compliance Risk: HIPAA requires secure transmission

Acceptance Criteria:
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security: max-age=31536000
- [ ] Content-Security-Policy configured
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy: restrictive
- [ ] Verified with security header scanners
- [ ] Tested in browser DevTools
- [ ] No console warnings/errors

Technical Solution:
1. Create securityHeaders middleware
2. Add all recommended headers
3. Configure CSP for React app
4. Test with Mozilla Observatory
5. Monitor for regressions

Deployment:
- Deploy to staging first
- Verify all functionality still works
- Deploy to production
- Monitor error logs for CSP violations
```

---

## Issue P0.3: Encryption at Rest for Sensitive Data

**Priority**: P0 - CRITICAL  
**Type**: Data Protection  
**Effort**: 12 hours  
**Timeline**: Week 1

```
Title: SECURITY: Implement encryption at rest for sensitive patient data

Labels: security, critical, data-protection, p0

Problem:
Sensitive patient data (medical history, allergies, conditions) is stored in plaintext in the database. If database is compromised, all patient data is exposed.

Impact:
- Data Breach Risk: CRITICAL
- Regulatory Risk: HIPAA violation if breached
- Patient Privacy: SEVERE
- Reputation: Catastrophic

Acceptance Criteria:
- [ ] AES-256-GCM encryption implemented
- [ ] Encryption key managed securely (env variable)
- [ ] IV (Initialization Vector) randomized per record
- [ ] Authentication tag verified on decryption
- [ ] Encrypted fields: email, phone, allergies, conditions, medical_history
- [ ] Encryption transparent to application code
- [ ] Decryption/Encryption tested
- [ ] Key rotation strategy documented
- [ ] Database migration for existing data completed

Technical Solution:
1. Implement encryptField/decryptField functions
2. Update database schema to mark encrypted fields
3. Create middleware to auto-decrypt on read
4. Create middleware to auto-encrypt on write
5. Migrate existing patient data
6. Test encryption/decryption
7. Document key management

Database Fields to Encrypt:
- users.email (sensitive identifier)
- users.phone (sensitive identifier)
- users.allergies (medical)
- users.chronicConditions (medical)

Security Considerations:
- Never log encrypted values
- Never expose encryption keys
- Rotate keys annually
- Backup encrypted keys separately
```

---

## Issue P0.4: Comprehensive Audit Logging for Compliance

**Priority**: P0 - CRITICAL  
**Type**: Compliance & Audit  
**Effort**: 14 hours  
**Timeline**: Week 1

```
Title: SECURITY: Implement complete audit logging for all sensitive operations

Labels: security, critical, audit, compliance, p0

Problem:
No comprehensive audit trail for prescription approvals, medication dispensing, user access. This is required for HIPAA compliance and clinical governance.

Impact:
- Compliance Risk: HIPAA requires audit trails
- Clinical Safety: Cannot track who approved/dispensed medications
- Legal: Cannot prove liability in case of adverse event
- Regulatory: Inspection finding if audited

Acceptance Criteria:
- [ ] All prescription status changes logged
- [ ] All medication dispensing logged
- [ ] All user access to patient data logged
- [ ] All admin operations logged
- [ ] Logs include: timestamp, user, action, entity, changes, IP, user-agent
- [ ] Logs are immutable (append-only)
- [ ] Logs cannot be modified/deleted (even by admins)
- [ ] Audit log viewer for compliance officers
- [ ] Log retention: 7 years minimum
- [ ] Encryption of logs (at rest)

Technical Solution:
1. Create auditLog table (immutable)
2. Create auditMiddleware to intercept sensitive operations
3. Log all POST/PUT/DELETE on prescription/order/user endpoints
4. Create audit log viewer UI
5. Implement audit log encryption
6. Create audit log export (PDF/CSV)
7. Test immutability

Sensitive Operations to Log:
- Prescription approved/rejected
- Medication dispensed
- Order shipped/delivered
- User created/deleted
- User role changed
- Admin operations
- Data access by users

Compliance Notes:
- HIPAA requires audit trails for 6 years (minimum)
- Must include: who, what, when, where, why
- Must prevent tampering
```

---

## Issue P0.5: Role-Based Access Control (RBAC) Enforcement

**Priority**: P0 - CRITICAL  
**Type**: Authorization  
**Effort**: 16 hours  
**Timeline**: Week 1

```
Title: SECURITY: Enforce strict RBAC on all protected endpoints

Labels: security, critical, authorization, rbac, p0

Problem:
RBACis partially implemented but not enforced on all endpoints. A staff member could potentially access admin APIs or a customer could access pharmacist functions.

Impact:
- Privilege Escalation Risk: HIGH
- Unauthorized Access Risk: HIGH
- Data Breach Risk: MEDIUM
- Liability: HIGH

Acceptance Criteria:
- [ ] Admin endpoints require admin role (verified)
- [ ] Pharmacist endpoints require pharmacist role (verified)
- [ ] Staff endpoints require staff role (verified)
- [ ] Driver endpoints require driver role (verified)
- [ ] Customer endpoints require customer role (verified)
- [ ] All endpoints check authorization before processing
- [ ] Denied attempts logged
- [ ] Cross-role access attempts trigger alert
- [ ] Test with role-based access matrix
- [ ] 100% endpoint coverage

Technical Solution:
1. Create permission matrix:
   - Admin: all operations
   - Pharmacist: prescriptions, inventory view, dispensing
   - Staff: order processing, POS
   - Driver: deliveries, own profile
   - Customer: own orders, prescriptions, profile
2. Create requireRole middleware
3. Apply middleware to all protected routes
4. Test authorization on all endpoints
5. Add authorization tests

Endpoints to Secure:
- DELETE /api/users/* (admin only)
- PUT /api/users/*/role (admin only)
- POST /api/inventory/* (admin/pharmacist only)
- PUT /api/prescriptions/:id (pharmacist only)
- POST /api/orders/:id/dispense (staff only)
- PUT /api/deliveries/:id/status (driver only)

Compliance:
- CWE-639: Authorization Bypass Through User-Controlled Key
- OWASP A01: Broken Access Control
```

---

## Issue P0.6: Input Validation & SQL/XSS Injection Prevention

**Priority**: P0 - CRITICAL  
**Type**: Security Vulnerability  
**Effort**: 20 hours  
**Timeline**: Week 1-2

```
Title: SECURITY: Implement complete input validation and injection prevention

Labels: security, critical, injection, validation, p0

Problem:
Missing input validation on many endpoints allows:
- SQL Injection (Drizzle ORM helps but not all inputs protected)
- XSS attacks (stored XSS in prescription notes, etc.)
- NoSQL injection
- Command injection

Impact:
- Data Breach Risk: CRITICAL
- Patient Data Compromise: CRITICAL
- System Takeover Risk: HIGH

Acceptance Criteria:
- [ ] All user inputs validated with express-validator
- [ ] All string inputs sanitized with DOMPurify
- [ ] All HTML inputs escaped
- [ ] SQL queries use parameterized statements (Drizzle default)
- [ ] File uploads validated (type, size)
- [ ] URLs validated
- [ ] Email addresses validated
- [ ] Phone numbers validated
- [ ] Numeric inputs range-checked
- [ ] Enum fields validated against whitelist
- [ ] OWASP Top 10 injection tests pass

Technical Solution:
1. Install express-validator and DOMPurify
2. Create validation schemas for all inputs
3. Add validation middleware to all endpoints
4. Sanitize all HTML inputs
5. Test with OWASP payloads
6. Create validation test suite

Validation Rules:
- Email: must be valid email format
- Phone: must be valid Malawi phone format
- UUID: must be valid UUID v4
- Numeric: must be within range
- String: must not exceed length limit
- HTML: must not contain script tags

Compliance:
- CWE-89: SQL Injection
- CWE-79: Cross-site Scripting (XSS)
- OWASP A03: Injection
```

