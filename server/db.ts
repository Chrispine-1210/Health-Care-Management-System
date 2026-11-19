import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { resolveDatabaseUrl } from './database-config.mjs';

neonConfig.webSocketConstructor = ws;

const connectionString = resolveDatabaseUrl();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString,
  max: Math.max(1, Math.min(20, Number(process.env.DB_POOL_MAX) || (process.env.VERCEL ? 3 : 10))),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
  statement_timeout: 10_000,
});
export const db = drizzle({ client: pool, schema });
