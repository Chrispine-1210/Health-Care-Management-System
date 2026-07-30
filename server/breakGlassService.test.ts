import assert from 'node:assert/strict';
import test from 'node:test';
import { BreakGlassService } from './breakGlassService';

test('emergency access is actor- and patient-scoped and expires without renewal', () => {
  const service = new BreakGlassService();
  const activatedAt = new Date('2026-01-01T00:00:00.000Z');
  const grant = service.activate({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'immediate_threat',
    justification: 'Immediate clinical intervention is required.',
    durationMinutes: 5,
  }, activatedAt);

  assert.ok(service.getValidGrant(grant.id, 'doctor-a', 'patient-a', new Date('2026-01-01T00:04:59.000Z')));
  assert.equal(service.getValidGrant(grant.id, 'doctor-b', 'patient-a', activatedAt), undefined);
  assert.equal(service.getValidGrant(grant.id, 'doctor-a', 'patient-b', activatedAt), undefined);
  assert.equal(service.getValidGrant(grant.id, 'doctor-a', 'patient-a', grant.expiresAt), undefined);
});

test('rejected or closed emergency access cannot be used or silently reviewed twice', () => {
  const service = new BreakGlassService();
  const grant = service.activate({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'continuity_of_care',
    justification: 'The assigned clinician is unavailable during urgent care.',
    durationMinutes: 15,
  });
  const reviewed = service.review(grant.id, 'security-admin', 'rejected', 'Access was not justified by the incident record.');
  assert.equal(reviewed?.reviewState, 'rejected');
  assert.equal(service.getValidGrant(grant.id, 'doctor-a', 'patient-a'), undefined);
  assert.equal(service.review(grant.id, 'security-admin', 'closed', 'Second review is prohibited.'), undefined);
});
