import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const createAuditEntry = require('../../src/hooks/create-audit-entry');

const stored = {
  _id: 'e1',
  text: 'Lagemeldung',
  createdAt: new Date('2026-10-10T08:15:42.123Z'),
  reporter: 'Einsatzleiter',
  state: 'offen',
};

// Runs the hook like an external patch/update of the stored entry and returns the audit log
async function audit(data, method = 'patch') {
  const hook = {
    method,
    data,
    params: { before: { ...stored }, user: { initials: 'T' } },
    result: { ...stored, ...data },
    service: { patch: vi.fn() },
  };
  await createAuditEntry()(hook);
  return { log: hook.result.auditLog || [], patch: hook.service.patch };
}

describe('create-audit-entry hook', () => {
  it('records the fields that changed', async () => {
    const { log, patch } = await audit({ text: 'Lagemeldung ergänzt', state: 'bearb.' });
    expect(log.map(({ field, before, after, initials }) => ({ field, before, after, initials }))).toEqual([
      { field: 'text', before: 'Lagemeldung', after: 'Lagemeldung ergänzt', initials: 'T' },
      { field: 'state', before: 'offen', after: 'bearb.', initials: 'T' },
    ]);
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('ignores fields a patch does not contain', async () => {
    const { log, patch } = await audit({ text: 'Lagemeldung ergänzt' });
    expect(log.map(l => l.field)).toEqual(['text']);
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('treats the same time as unchanged, whether it is a Date or an ISO string', async () => {
    const { log, patch } = await audit({ createdAt: stored.createdAt.toISOString(), text: stored.text });
    expect(log).toEqual([]);
    expect(patch).not.toHaveBeenCalled();
  });

  it('records a changed time', async () => {
    const { log } = await audit({ createdAt: '2026-10-10T08:20:00.000Z' });
    expect(log.map(l => l.field)).toEqual(['createdAt']);
  });

  it('treats an empty form field like a field that was never set', async () => {
    const { log } = await audit({ reportedVia: '', direction: '', priority: '', comment: '', text: stored.text });
    expect(log).toEqual([]);
  });

  it('records a field that is cleared', async () => {
    const { log } = await audit({ reporter: '' });
    expect(log.map(({ field, before, after }) => ({ field, before, after }))).toEqual([
      { field: 'reporter', before: 'Einsatzleiter', after: '' },
    ]);
  });

  it('compares all fields on update, which replaces the entry', async () => {
    const { log } = await audit({ text: stored.text, createdAt: stored.createdAt.toISOString() }, 'update');
    expect(log.map(l => l.field)).toEqual(['reporter', 'state']);
  });
});
