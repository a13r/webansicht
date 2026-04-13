import { describe, it, beforeAll, afterEach } from 'vitest';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const app = require('../../src/app');

describe('\'resources\' service', () => {
  const service = app.service('resources');
  const logService = app.service('log');
  const created = [];

  beforeAll(async () => {
    const mongoose = app.get('mongooseClient');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || app.get('mongodb'));
    }
  });

  async function createResource(data) {
    const resource = await service.create({callSign: `TEST-${Date.now()}`, type: 'RTW', ...data});
    created.push(resource._id);
    return resource;
  }

  afterEach(async () => {
    for (const id of created) {
      try { await service.remove(id); } catch { /* already removed */ }
    }
    created.length = 0;
  });

  it('registered the service', () => {
    assert.ok(service, 'Registered the service');
  });

  it('patch does not update since when a non-state field changes', async () => {
    const resource = await createResource({destination: 'A'});
    const originalSince = new Date(resource.since).getTime();
    await sleep(10);
    const patched = await service.patch(resource._id, {destination: 'B'});
    const patchedSince = new Date(patched.since).getTime();
    assert.equal(patchedSince, originalSince, 'since should not change when only destination changes');
  });

  it('update does not update since when a non-state field changes', async () => {
    const resource = await createResource({destination: 'A'});
    const originalSince = new Date(resource.since).getTime();
    await sleep(10);
    const updated = await service.update(resource._id, {...JSON.parse(JSON.stringify(resource)), destination: 'B'});
    const updatedSince = new Date(updated.since).getTime();
    assert.equal(updatedSince, originalSince, 'since should not change when only destination changes');
  });

  it('patch updates since when state changes', async () => {
    const resource = await createResource({state: 1});
    const originalSince = new Date(resource.since).getTime();
    await sleep(10);
    const patched = await service.patch(resource._id, {state: 2});
    const patchedSince = new Date(patched.since).getTime();
    assert.ok(patchedSince > originalSince, `since should advance after state change (was ${originalSince}, got ${patchedSince})`);
  });

  it('log entry gets updated since only when state changes', async () => {
    const resource = await createResource({state: 1, info: 'old'});
    const originalSince = new Date(resource.since).getTime();
    await sleep(10);
    // Patching a non-state field should not update since on the log entry
    await service.patch(resource._id, {info: 'new'});
    const logs = await logService.find({query: {resource_id: resource._id.toString(), $sort: {since: -1}, $limit: 1}});
    assert.ok(logs.length > 0, 'should have created a log entry');
    const logSince = new Date(logs[0].since).getTime();
    assert.equal(logSince, originalSince, 'log since should not change when only info changes');
  });

  it('no new log entry when only non-tracked fields change', async () => {
    const resource = await createResource({ordering: 1});
    // Initial create produces one log entry
    const logsBefore = await logService.find({query: {resource_id: resource._id.toString()}});
    await sleep(10);
    await service.patch(resource._id, {ordering: 2});
    const logsAfter = await logService.find({query: {resource_id: resource._id.toString()}});
    assert.equal(logsAfter.length, logsBefore.length, 'no additional log entry for non-tracked field change');
  });
});
