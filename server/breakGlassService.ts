import { randomUUID } from 'node:crypto';

export type BreakGlassReviewState = 'pending' | 'approved' | 'rejected' | 'closed';

export interface BreakGlassGrant {
  id: string;
  actorId: string;
  patientId: string;
  reasonCode: 'immediate_threat' | 'continuity_of_care' | 'system_outage';
  justification: string;
  activatedAt: Date;
  expiresAt: Date;
  reviewState: BreakGlassReviewState;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export class BreakGlassService {
  private readonly grants = new Map<string, BreakGlassGrant>();

  activate(input: Omit<BreakGlassGrant, 'id' | 'activatedAt' | 'expiresAt' | 'reviewState'> & { durationMinutes: number }, now = new Date()): BreakGlassGrant {
    const durationMinutes = Math.min(Math.max(input.durationMinutes, 1), 15);
    const grant: BreakGlassGrant = {
      id: randomUUID(),
      actorId: input.actorId,
      patientId: input.patientId,
      reasonCode: input.reasonCode,
      justification: input.justification,
      activatedAt: now,
      expiresAt: new Date(now.getTime() + durationMinutes * 60_000),
      reviewState: 'pending',
    };
    this.grants.set(grant.id, grant);
    return grant;
  }

  getValidGrant(id: string, actorId: string, patientId: string, now = new Date()): BreakGlassGrant | undefined {
    const grant = this.grants.get(id);
    if (!grant || grant.actorId !== actorId || grant.patientId !== patientId) return undefined;
    if (grant.reviewState === 'rejected' || grant.reviewState === 'closed' || grant.expiresAt <= now) return undefined;
    return grant;
  }

  review(id: string, reviewerId: string, state: Exclude<BreakGlassReviewState, 'pending'>, notes: string): BreakGlassGrant | undefined {
    const grant = this.grants.get(id);
    if (!grant || grant.reviewState !== 'pending') return undefined;
    const reviewed = { ...grant, reviewState: state, reviewedBy: reviewerId, reviewedAt: new Date(), reviewNotes: notes };
    this.grants.set(id, reviewed);
    return reviewed;
  }
}

export const breakGlassService = new BreakGlassService();
