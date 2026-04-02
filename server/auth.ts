// server/auth.ts
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import OpenIDClient from "openid-client";
import type { Express, RequestHandler } from "express";
import passport from "passport";
import { Strategy } from "openid-client/passport";
import { getStorage } from "./storageManager";

// ───────────── ENV CHECK ─────────────
const REQUIRED_ENV = [
  "SESSION_SECRET",
  "REDIS_URL",
  "OIDC_ISSUER",
  "OIDC_CLIENT_ID",
  "BASE_URL",
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

// ───────────── REDIS SESSION ─────────────
const redis = new Redis(process.env.REDIS_URL!);
const RedisStore = connectRedis(session);

export function getSession() {
  const ttl = 7 * 24 * 60 * 60 * 1000; // 1 week
  return session({
    secret: process.env.SESSION_SECRET!,
    store: new RedisStore({ client: redis }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ttl,
    },
  });
}

// ───────────── OIDC CLIENT CACHE ─────────────
const { Issuer, generators, TokenSet } = OpenIDClient;
type TenantOIDC = { issuer: string; clientId: string; clientSecret?: string };
const TENANTS: Record<string, TenantOIDC> = {
  default: {
    issuer: process.env.OIDC_ISSUER!,
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
  },
};
const clientCache = new Map<string, any>();

async function getOIDCClient(tenantId: string) {
  if (clientCache.has(tenantId)) return clientCache.get(tenantId);
  const tenant = TENANTS[tenantId] || TENANTS.default;
  const issuer = await Issuer.discover(tenant.issuer);
  const client = new issuer.Client({
    client_id: tenant.clientId,
    client_secret: tenant.clientSecret,
    token_endpoint_auth_method: tenant.clientSecret ? "client_secret_basic" : "none",
    response_types: ["code"],
  });
  clientCache.set(tenantId, client);
  return client;
}

// ───────────── PKCE ─────────────
export function generatePKCE() {
  const verifier = generators.codeVerifier();
  const challenge = generators.codeChallenge(verifier);
  return { verifier, challenge };
}

// ───────────── REFRESH / MFA / BREAK-GLASS ─────────────
async function storeRefreshToken(userId: string, tokenSet: TokenSet) {
  if (tokenSet.refresh_token) {
    await redis.set(`refresh:${userId}`, tokenSet.refresh_token, "EX", 60 * 60 * 24 * 30);
  }
}
async function getRefreshToken(userId: string) {
  return redis.get(`refresh:${userId}`);
}
async function setMFA(userId: string, verified: boolean) {
  await redis.set(`mfa:${userId}`, verified ? "1" : "0");
}
async function getMFA(userId: string) {
  return (await redis.get(`mfa:${userId}`)) === "1";
}
async function grantBreakGlass(userId: string) {
  await redis.set(
    `breakglass:${userId}`,
    "1",
    "EX",
    Number(process.env.BREAK_GLASS_TTL_MINUTES || 15) * 60
  );
}
async function hasBreakGlass(userId: string) {
  return (await redis.exists(`breakglass:${userId}`)) === 1;
}

// ───────────── AUDIT LOG ─────────────
export async function auditLog(userId: string, action: string, details: Record<string, any> = {}) {
  const log = { userId, action, timestamp: new Date().toISOString(), ...details };
  await redis.rpush("audit:logs", JSON.stringify(log));
}

// ───────────── USER HELPERS ─────────────
function updateUserSession(user: any, tokens: TokenSet) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const storage = getStorage();
  await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
  });
}

// ───────────── POLICY-AS-CODE ─────────────
type Policy = { dataType: string; rolesAllowed: string[]; consentRequired: boolean };
const POLICIES: Policy[] = [
  { dataType: "patient_record", rolesAllowed: ["doctor", "nurse"], consentRequired: true },
  { dataType: "lab_results", rolesAllowed: ["doctor"], consentRequired: true },
  { dataType: "metadata", rolesAllowed: ["admin"], consentRequired: false },
];

export async function enforcePolicy(userId: string, dataType: string, patientId?: string): Promise<boolean> {
  const policy = POLICIES.find((p) => p.dataType === dataType);
  if (!policy) return false;
  const dbUser = await getStorage().getUser(userId);
  if (!dbUser || !policy.rolesAllowed.includes(dbUser.role)) return false;

  if (policy.consentRequired && patientId) {
    const consent = await getStorage().getConsent?.(patientId, userId, dataType);
    if (!consent) return false;
  }

  await auditLog(userId, "access", { dataType, patientId });
  return true;
}

export async function generateEnvelope(userId: string, patientId: string) {
  const allowedData: Record<string, boolean> = {};
  for (const policy of POLICIES) {
    allowedData[policy.dataType] = await enforcePolicy(userId, policy.dataType, patientId);
  }
  return { patientId, allowedData, generatedAt: new Date().toISOString() };
}

// ───────────── PASSPORT STRATEGY ─────────────
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const registered = new Set<string>();

  async function ensureStrategy(domain: string) {
    const name = `oidc:${domain}`;
    if (registered.has(name)) return;

    const client = await getOIDCClient("default");
    passport.use(
      new Strategy(
        {
          name,
          config: client,
          scope: "openid email profile offline_access",
          callbackURL: `${process.env.BASE_URL}/api/callback`,
        },
        async (tokens, done) => {
          const user: any = {};
          updateUserSession(user, tokens);
          await storeRefreshToken(tokens.claims().sub, tokens);
          await setMFA(tokens.claims().sub, false);
          await upsertUser(tokens.claims());
          await auditLog(tokens.claims().sub, "login");
          done(null, user);
        }
      )
    );
    registered.add(name);
  }

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get("/api/login", async (req, res, next) => {
    await ensureStrategy(req.hostname);
    passport.authenticate(`oidc:${req.hostname}`, { prompt: "login consent" })(req, res, next);
  });

  app.get("/api/callback", async (req, res, next) => {
    await ensureStrategy(req.hostname);
    passport.authenticate(`oidc:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const user = req.user as any;
    if (user?.claims?.sub) {
      const uid = user.claims.sub;
      await redis.del(`refresh:${uid}`);
      await redis.del(`mfa:${uid}`);
      await redis.del(`breakglass:${uid}`);
      await auditLog(uid, "logout");
    }
    req.logout(() => {});
    res.redirect("/");
  });
}

// ───────────── MIDDLEWARE ─────────────
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) return res.status(401).json({ message: "Unauthorized" });

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  const refreshToken = await getRefreshToken(user.claims.sub);
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  try {
    const client = await getOIDCClient("default");
    const tokenResponse = await client.refresh(refreshToken);
    updateUserSession(user, tokenResponse);
    await storeRefreshToken(user.claims.sub, tokenResponse);
    await auditLog(user.claims.sub, "refresh");
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (...allowedRoles: string[]): RequestHandler => async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) return res.status(401).json({ message: "Unauthorized" });

  const dbUser = await getStorage().getUser(user.claims.sub);
  if (!dbUser || !allowedRoles.includes(dbUser.role)) return res.status(403).json({ message: "Forbidden" });

  next();
};
