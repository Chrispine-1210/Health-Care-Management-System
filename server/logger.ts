type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

const REDACTED = '[REDACTED]';
const SENSITIVE_LOG_KEY = /authorization|cookie|password|token|secret|database_url|connection|string|medical|clinical|diagnosis|allerg|card|bank/i;

export function redactLogValue(value: unknown, key = ''): unknown {
  if (SENSITIVE_LOG_KEY.test(key)) return REDACTED;
  if (typeof value === 'string' && /(?:postgres(?:ql)?|mysql|mongodb):\/\//i.test(value)) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => redactLogValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactLogValue(childValue, childKey)]));
  }
  return value;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;

  log(level: LogLevel, message: string, context?: Record<string, any>, userId?: string, requestId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? redactLogValue(context) as Record<string, any> : undefined,
      userId,
      requestId,
    };
    
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, message, entry.context);
    else if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }

  debug(msg: string, ctx?: Record<string, any>) { this.log('debug', msg, ctx); }
  info(msg: string, ctx?: Record<string, any>) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: Record<string, any>) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: Record<string, any>) { this.log('error', msg, ctx); }

  getLogs(level?: LogLevel, limit = 100) {
    let filtered = this.logs;
    if (level) filtered = filtered.filter(l => l.level === level);
    return filtered.slice(-limit);
  }
}

export const logger = new Logger();
