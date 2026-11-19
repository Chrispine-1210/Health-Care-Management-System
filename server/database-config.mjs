// One selection rule for the API and migration runner. A branch-scoped
// Explicit Thandizo/DATABASE_URL values override provider-managed aliases.
export function resolveDatabaseUrl(env = process.env) {
  return env.THANDIZO_DATABASE_URL?.trim() || env.DATABASE_URL?.trim() || env.POSTGRES_URL?.trim() || undefined;
}
