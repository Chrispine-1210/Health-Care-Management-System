import { logger } from './logger';

interface EnvVars {
  NODE_ENV: string;
  PORT: string;
  JWT_SECRET: string;
  LOG_LEVEL: string;
}

export function validateEnvironment(): EnvVars {
  const required: (keyof EnvVars)[] = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
  const missing: string[] = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    logger.warn('Missing environment variables', { missing });
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '5000',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };
}

export function logEnvironmentInfo() {
  const env = validateEnvironment();
  logger.info('Environment loaded', {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    LOG_LEVEL: env.LOG_LEVEL,
  });
}
