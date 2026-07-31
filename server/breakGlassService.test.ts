import assert from 'node:assert/strict';
import test from 'node:test';
import { BreakGlassService } from './breakGlassService';
import { MemoryStorage } from './memoryStorage';

test('emergency access is actor- and patient-scoped and expires without renewal', async () => {
  const storage = new MemoryStorage();
  const service = new BreakGlassService(() => storage);
  const activatedAt = new Date('2026-01-01T00:00:00.000Z');
  const grant = await service.activate({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'immediate_threat',
    justification: 'Immediate clinical intervention is required.',
    durationMinutes: 5,
  }, activatedAt);

  assert.ok(await service.getValidGrant(grant.id, 'doctor-a', 'patient-a', new Date('2026-01-01T00:04:59.000Z')));
  assert.equal(await service.getValidGrant(grant.id, 'doctor-b', 'patient-a', activatedAt), undefined);
  assert.equal(await service.getValidGrant(grant.id, 'doctor-a', 'patient-b', activatedAt), undefined);
  assert.equal(await service.getValidGrant(grant.id, 'doctor-a', 'patient-a', grant.expiresAt), undefined);
});

test('rejected or closed emergency access cannot be used or silently reviewed twice', async () => {
  const storage = new MemoryStorage();
  const service = new BreakGlassService(() => storage);
  const grant = await service.activate({
    actorId: 'doctor-a',
    patientId: 'patient-a',
    reasonCode: 'continuity_of_care',
    justification: 'The assigned clinician is unavailable during urgent care.',
    durationMinutes: 15,
  });
  const reviewed = await service.review(grant.id, 'security-admin', 'rejected', 'Access was not justified by the incident record.');
  assert.equal(reviewed?.reviewState, 'rejected');
  assert.equal(await service.getValidGrant(grant.id, 'doctor-a', 'patient-a'), undefined);
  assert.equal(await service.review(grant.id, 'security-admin', 'closed', 'Second review is prohibited.'), undefined);
});
