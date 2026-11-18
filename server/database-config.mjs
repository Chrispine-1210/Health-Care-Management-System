// One selection rule for the API and migration runner. A branch-scoped
// DATABASE_URL must override Vercel's project-wide integration variables.
export function resolveDatabaseUrl(env = process.env) {
  return env.DATABASE_URL?.trim() || env.POSTGRES_URL?.trim() || undefined;
}
