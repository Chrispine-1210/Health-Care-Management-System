import type { Request } from 'express';
import { getStorage } from './storageManager';
import { logger } from './logger';
import type { InsertAuditLog } from '@shared/schema';
import { encryptSensitiveData } from './cryptoService';

export interface SensitiveAuditEvent {
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, unknown>;
}

export async function recordAuditEvent(
  req: Pick<Request, 'ip' | 'headers' | 'user'>,
  event: SensitiveAuditEvent,
): Promise<void> {
  const auditPayload: InsertAuditLog = {
    userId: req.user?.id,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    changes: event.changes ? encryptSensitiveData(event.changes) : undefined,
    ipAddress: req.ip,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
  };

  try {
    await getStorage().createAuditLog(auditPayload);
  } catch (error) {
    logger.error('Audit logging failed', { error, action: auditPayload.action, entityType: auditPayload.entityType, entityId: auditPayload.entityId });
    throw error;
  }
}
