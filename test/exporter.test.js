import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../src/app');
const tar = require('tar');

// A valid tar archive with a single file and no database directory
async function tarWithoutDatabase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'exporter-test-'));
  try {
    fs.writeFileSync(path.join(dir, 'readme.txt'), 'no database here');
    const chunks = [];
    for await (const chunk of tar.create({ cwd: dir }, ['readme.txt'])) chunks.push(chunk);
    return Buffer.concat(chunks);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('backup routes', () => {
  const users = app.service('users');
  const created = [];
  let server;
  let baseUrl;
  let adminToken;
  let dispoToken;

  async function login(roles) {
    const username = `exporter-${roles.join('-')}-${Date.now()}`;
    const password = 'secret';
    // initials has a unique index, and a missing value counts as null, so set one per user
    const user = await users.create({ username, name: username, initials: username, password, roles });
    created.push(user._id);
    const { accessToken } = await app.service('authentication')
      .create({ strategy: 'local', username, password });
    return accessToken;
  }

  function post(path, { token, body } = {}) {
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Connection: 'close',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
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
    adminToken = await login(['admin']);
    dispoToken = await login(['dispo']);
  });

  afterAll(async () => {
    for (const id of created) {
      try { await users.remove(id); } catch { /* already removed */ }
    }
    await new Promise(resolve => server.close(resolve));
  });

  for (const path of ['/export.tar', '/import.tar']) {
    it(`${path} rejects requests without a token`, async () => {
      const res = await post(path);
      assert.equal(res.status, 401);
    });

    it(`${path} rejects an invalid token`, async () => {
      const res = await post(path, { token: 'not-a-jwt' });
      assert.equal(res.status, 401);
    });

    it(`${path} rejects users without the admin role`, async () => {
      const body = new FormData();
      body.append('import', new Blob(['not a tar']), 'backup.tar');
      const res = await post(path, { token: dispoToken, body });
      assert.equal(res.status, 403);
      assert.equal((await res.json()).message, 'Forbidden');
    });
  }

  it('/import.tar lets admins through to the restore', async () => {
    // An archive without a database directory is rejected by the restore itself (400),
    // which shows the request got past the admin check without touching the database.
    const body = new FormData();
    body.append('import', new Blob([await tarWithoutDatabase()]), 'backup.tar');
    const res = await post('/import.tar', { token: adminToken, body });
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /Invalid backup/);
  });

  it('accepts the token from a form field', async () => {
    const res = await post('/export.xlsx', { body: new URLSearchParams({ accessToken: adminToken }) });
    assert.equal(res.status, 200);
    await res.arrayBuffer();
  });

  it('/export.xlsx stays available to non-admin users', async () => {
    const res = await post('/export.xlsx', { token: dispoToken });
    assert.equal(res.status, 200);
    await res.arrayBuffer();
  });
});
