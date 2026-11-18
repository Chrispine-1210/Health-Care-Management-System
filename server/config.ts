import { resolveDatabaseUrl } from './database-config.mjs';

export interface Config {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtExpiry: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-12345678',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};

export function productionConfigurationIssues(env: NodeJS.ProcessEnv = process.env): string[] {
  const issues: string[] = [];
  if (!resolveDatabaseUrl(env)) issues.push('DATABASE_URL');
  for (const name of ['JWT_SECRET', 'PATIENT_DATA_ENCRYPTION_KEY'] as const) {
    const value = env[name]?.trim();
    if (!value || value.length < 32 || /change.this|dev.secret|example|placeholder/i.test(value)) {
      issues.push(`${name} (independent secret of at least 32 characters)`);
    }
  }
  if (env.JWT_SECRET && env.JWT_SECRET === env.PATIENT_DATA_ENCRYPTION_KEY) {
    issues.push('JWT_SECRET and PATIENT_DATA_ENCRYPTION_KEY must differ');
  }
  if (env.USE_DATABASE_STORAGE !== 'true') issues.push('USE_DATABASE_STORAGE=true');
  const origins = env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || [];
  if (!origins.length || origins.some((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol !== 'https:' || url.origin !== origin || Boolean(url.username || url.password);
    } catch {
      return true;
    }
  })) issues.push('ALLOWED_ORIGINS (explicit HTTPS origins)');
  return issues;
}

export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const issues = productionConfigurationIssues();
  if (issues.length) throw new Error(`Invalid production configuration: ${issues.join(', ')}`);
}

export function isDevelopment() {
  return config.nodeEnv === 'development';
}

export function isProduction() {
  return config.nodeEnv === 'production';
}
