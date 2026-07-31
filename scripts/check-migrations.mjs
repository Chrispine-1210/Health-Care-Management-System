import { readFile, readdir } from 'node:fs/promises';

const files = (await readdir('migrations')).filter((name) => name.endsWith('.sql')).sort();
if (!files.length) throw new Error('No SQL migrations found');
const prefixes = new Set();
for (const file of files) {
  const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) throw new Error(`Invalid migration filename: ${file}`);
  if (prefixes.has(match[1])) throw new Error(`Duplicate migration sequence: ${match[1]}`);
  prefixes.add(match[1]);
  const sql = await readFile(`migrations/${file}`, 'utf8');
  if (!sql.trim()) throw new Error(`Empty migration: ${file}`);
  if (/DROP\s+(?:TABLE|SCHEMA|DATABASE)\b/i.test(sql)) throw new Error(`Destructive migration requires manual review: ${file}`);
}
if (!files.some((file) => file.includes('healthcare_roles'))) throw new Error('Healthcare role migration is missing');
if (!files.some((file) => file.includes('immutable_audit_logs'))) throw new Error('Immutable audit migration is missing');
if (!files.some((file) => file.includes('stock_movement_ledger'))) throw new Error('Stock movement ledger migration is missing');
process.stdout.write(`Validated ${files.length} ordered migrations\n`);
