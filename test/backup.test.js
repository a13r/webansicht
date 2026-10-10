import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../src/app');
const tar = require('tar');
const { BSON, ObjectId } = require('mongoose').mongo;

// Unpacks a backup, lets `change` edit its database directory, and packs it again
async function editBackup(backup, change) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
  try {
    const file = path.join(dir, 'backup.tar');
    fs.writeFileSync(file, Buffer.from(backup));
    const extractDir = path.join(dir, 'x');
    fs.mkdirSync(extractDir);
    await tar.extract({ file, cwd: extractDir });
    const [dbName] = fs.readdirSync(extractDir);
    change(path.join(extractDir, dbName));
    const chunks = [];
    for await (const chunk of tar.create({ cwd: extractDir }, [dbName])) chunks.push(chunk);
    return Buffer.concat(chunks);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeDoc(dbDir, collection, fileName, data) {
  const collDir = path.join(dbDir, collection);
  fs.mkdirSync(collDir, { recursive: true });
  fs.writeFileSync(path.join(collDir, fileName), data);
}

describe('database backup and restore', () => {
  const users = app.service('users');
  const resources = app.service('resources');
  let db;
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

  async function exportBackup() {
    const res = await post('/export.tar');
    assert.equal(res.status, 200, await res.clone().text());
    return res.arrayBuffer();
  }

  function importBackup(backup) {
    const body = new FormData();
    body.append('import', new Blob([backup]), 'backup.tar');
    return post('/import.tar', body);
  }

  async function collectionNames() {
    return (await db.listCollections().toArray()).map(c => c.name);
  }

  beforeAll(async () => {
    const mongoose = app.get('mongooseClient');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || app.get('mongodb'));
    }
    await mongoose.connection.asPromise();
    db = mongoose.connection.db;
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
    const backup = await exportBackup();

    // Changes made after the export must be gone after the restore
    await resources.remove(kept._id);
    const added = await resources.create({ callSign: `AFTER-${Date.now()}`, type: 'RTW' });
    await db.collection('restore_test_extra').insertOne({ note: 'not in the backup' });

    const res = await importBackup(backup);
    assert.equal(res.status, 200, await res.clone().text());

    const restored = await resources.get(kept._id);
    assert.equal(restored.callSign, kept.callSign);
    assert.equal(String(restored._id), String(kept._id));
    await assert.rejects(resources.get(added._id), { name: 'NotFound' });
    assert.ok(!(await collectionNames()).includes('restore_test_extra'));

    await resources.remove(kept._id);
  });

  it('rejects an upload without a file', async () => {
    const res = await post('/import.tar', new FormData());
    assert.equal(res.status, 400);
    assert.equal((await res.json()).message, 'No file uploaded');
  });

  it('rejects a file that is not a tar archive', async () => {
    const res = await importBackup(Buffer.from('not a tar archive'));
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /^Invalid backup/);
  });

  it('leaves the database unchanged when a backup file is corrupt', async () => {
    const existing = await resources.create({ callSign: `CORRUPT-${Date.now()}`, type: 'RTW' });
    const backup = await editBackup(await exportBackup(), dbDir => {
      fs.rmSync(path.join(dbDir, 'resources'), { recursive: true, force: true });
      writeDoc(dbDir, 'resources', 'broken.bson', Buffer.from('definitely not bson'));
    });
    const collectionsBefore = await collectionNames();

    const res = await importBackup(backup);
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /^Invalid backup: resources\/broken\.bson/);

    assert.equal((await resources.get(existing._id)).callSign, existing.callSign);
    assert.deepEqual((await collectionNames()).sort(), collectionsBefore.sort());

    await resources.remove(existing._id);
  });

  it('leaves the database unchanged when inserting the backup fails', async () => {
    const existing = await resources.create({ callSign: `DUP-${Date.now()}`, type: 'RTW' });
    // Two documents with the same _id make the insert fail with a duplicate key error
    const _id = new ObjectId();
    const backup = await editBackup(await exportBackup(), dbDir => {
      writeDoc(dbDir, 'resources', 'dup-a.bson', BSON.serialize({ _id, callSign: 'A' }));
      writeDoc(dbDir, 'resources', 'dup-b.bson', BSON.serialize({ _id, callSign: 'B' }));
    });
    const collectionsBefore = await collectionNames();

    const res = await importBackup(backup);
    assert.equal(res.status, 500);
    assert.match((await res.json()).message, /duplicate key/);

    assert.equal((await resources.get(existing._id)).callSign, existing.callSign);
    await assert.rejects(resources.get(_id), { name: 'NotFound' });
    // The temporary collections are cleaned up again
    assert.deepEqual((await collectionNames()).sort(), collectionsBefore.sort());

    await resources.remove(existing._id);
  });

  it('keeps existing users when a backup user conflicts with one', async () => {
    const conflicting = { _id: new ObjectId(), username: (await users.get(userId)).username, initials: 'XYZ-CONFLICT' };
    const backup = await editBackup(await exportBackup(), dbDir => {
      writeDoc(dbDir, 'users', `${conflicting._id}.bson`, BSON.serialize(conflicting));
    });

    const res = await importBackup(backup);
    assert.equal(res.status, 200, await res.clone().text());

    assert.equal(await db.collection('users').findOne({ _id: conflicting._id }), null);
    assert.ok(await db.collection('users').findOne({ _id: userId }));
  });
});
