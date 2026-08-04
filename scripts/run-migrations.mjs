import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

try {
  await pool.query("SELECT pg_advisory_lock(hashtext('thandizo_app_migrations'))");
  await pool.query('CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const applied = new Set((await pool.query('SELECT name FROM app_migrations')).rows.map((row) => row.name));
  const files = (await readdir('migrations')).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    if (applied.has(name)) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await readFile(path.join('migrations', name), 'utf8'));
      await client.query('INSERT INTO app_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      process.stdout.write(`Applied ${name}\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.query("SELECT pg_advisory_unlock(hashtext('thandizo_app_migrations'))").catch(() => undefined);
  await pool.end();
}
