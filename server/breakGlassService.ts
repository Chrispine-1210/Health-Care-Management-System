import type { EmergencyAccessGrant, InsertAuditLog } from '@shared/schema';
import type { IStorage } from './storage';

export type BreakGlassReviewState = 'pending' | 'approved' | 'rejected' | 'closed';
export type BreakGlassGrant = EmergencyAccessGrant;

type ActivationInput = {
  actorId: string;
  patientId: string;
  reasonCode: 'immediate_threat' | 'continuity_of_care' | 'system_outage';
  justification: string;
  durationMinutes: number;
};

export class BreakGlassService {
  constructor(private readonly storageProvider?: () => IStorage) {}

  private async storage(): Promise<IStorage> {
    if (this.storageProvider) return this.storageProvider();
    const { getStorage } = await import('./storageManager');
    return getStorage();
  }

  async activate(input: ActivationInput, now = new Date()): Promise<BreakGlassGrant> {
    const durationMinutes = Math.min(Math.max(input.durationMinutes, 1), 15);
    return (await this.storage()).createEmergencyAccessGrant({
      actorId: input.actorId,
      patientId: input.patientId,
      reasonCode: input.reasonCode,
      justification: input.justification,
      activatedAt: now,
      expiresAt: new Date(now.getTime() + durationMinutes * 60_000),
      reviewState: 'pending',
    });
  }

  async activateWithAudit(input: ActivationInput, audit: InsertAuditLog, now = new Date()): Promise<BreakGlassGrant> {
    const durationMinutes = Math.min(Math.max(input.durationMinutes, 1), 15);
    return (await this.storage()).createEmergencyAccessGrantWithAudit({
      actorId: input.actorId,
      patientId: input.patientId,
      reasonCode: input.reasonCode,
      justification: input.justification,
      activatedAt: now,
      expiresAt: new Date(now.getTime() + durationMinutes * 60_000),
      reviewState: 'pending',
    }, audit);
  }

  async getValidGrant(id: string, actorId: string, patientId: string, now = new Date()): Promise<BreakGlassGrant | undefined> {
    const grant = await (await this.storage()).getEmergencyAccessGrant(id);
    if (!grant || grant.actorId !== actorId || grant.patientId !== patientId) return undefined;
    if (grant.reviewState === 'rejected' || grant.reviewState === 'closed' || grant.expiresAt <= now) return undefined;
    return grant;
  }

  async review(id: string, reviewerId: string, state: Exclude<BreakGlassReviewState, 'pending'>, notes: string): Promise<BreakGlassGrant | undefined> {
    return (await this.storage()).reviewEmergencyAccessGrant(id, {
      reviewState: state,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
  }

  async reviewWithAudit(id: string, reviewerId: string, state: Exclude<BreakGlassReviewState, 'pending'>, notes: string, audit: InsertAuditLog): Promise<BreakGlassGrant | undefined> {
    return (await this.storage()).reviewEmergencyAccessGrantWithAudit(id, {
      reviewState: state,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    }, audit);
  }
}

export const breakGlassService = new BreakGlassService();
