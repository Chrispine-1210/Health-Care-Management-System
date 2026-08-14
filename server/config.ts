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

export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['DATABASE_URL', 'JWT_SECRET', 'PATIENT_DATA_ENCRYPTION_KEY', 'ALLOWED_ORIGINS'];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (process.env.USE_DATABASE_STORAGE !== 'true') missing.push('USE_DATABASE_STORAGE=true');
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  if ((process.env.JWT_SECRET?.length || 0) < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  if ((process.env.PATIENT_DATA_ENCRYPTION_KEY?.length || 0) < 32) throw new Error('PATIENT_DATA_ENCRYPTION_KEY must contain at least 32 characters');
  if (process.env.ALLOWED_ORIGINS?.split(',').some((origin) => origin.trim() === '*')) throw new Error('Wildcard production CORS origins are prohibited');
}

export function isDevelopment() {
  return config.nodeEnv === 'development';
}

export function isProduction() {
  return config.nodeEnv === 'production';
}
