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

export function isDevelopment() {
  return config.nodeEnv === 'development';
}

export function isProduction() {
  return config.nodeEnv === 'production';
}
