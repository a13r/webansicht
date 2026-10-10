import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../src/app');

describe('database backup round trip', () => {
  const users = app.service('users');
  const resources = app.service('resources');
  let server;
  let baseUrl;
  let token;
  let userId;

  function post(path, body) {
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { Connection: 'close', Authorization: `Bearer ${token}` },
      body,
    });
  }

  beforeAll(async () => {
    const mongoose = app.get('mongooseClient');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || app.get('mongodb'));
    }
    server = await app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;

    const username = `backup-admin-${Date.now()}`;
    const password = 'secret';
    // initials has a unique index, and a missing value counts as null, so set one
    const user = await users.create({ username, name: username, initials: username, password, roles: ['admin'] });
    userId = user._id;
    ({ accessToken: token } = await app.service('authentication')
      .create({ strategy: 'local', username, password }));
  });

  afterAll(async () => {
    try { await users.remove(userId); } catch { /* already removed */ }
    await new Promise(resolve => server.close(resolve));
  });

  it('exports the database and restores it from the backup', async () => {
    const kept = await resources.create({ callSign: `BACKUP-${Date.now()}`, type: 'RTW' });

    const exported = await post('/export.tar');
    assert.equal(exported.status, 200, await exported.clone().text());
    const backup = await exported.arrayBuffer();

    // Changes made after the export must be gone after the restore
    await resources.remove(kept._id);
    const added = await resources.create({ callSign: `AFTER-${Date.now()}`, type: 'RTW' });

    const body = new FormData();
    body.append('import', new Blob([backup]), 'backup.tar');
    const imported = await post('/import.tar', body);
    assert.equal(imported.status, 200, await imported.clone().text());

    const restored = await resources.get(kept._id);
    assert.equal(restored.callSign, kept.callSign);
    assert.equal(String(restored._id), String(kept._id));
    await assert.rejects(resources.get(added._id), { name: 'NotFound' });

    await resources.remove(kept._id);
  });
});
