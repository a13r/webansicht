import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const app = require('../src/app');

const publicDir = path.resolve(app.get('public'));
const fixtures = ['_test-asset.txt', '_test-index.html'];

describe('Static asset serving', () => {
  let server;

  beforeAll(async () => {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, '_test-asset.txt'), 'hello');
    fs.writeFileSync(path.join(publicDir, '_test-index.html'), '<!doctype html><html><body>test</body></html>');
    server = await app.listen(3031);
  });

  afterAll(() => {
    for (const f of fixtures) {
      const p = path.join(publicDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    return new Promise(resolve => server.close(resolve));
  });

  it('serves a static file', async () => {
    const res = await fetch('http://localhost:3031/_test-asset.txt', {
      headers: { 'Connection': 'close' }
    });
    const body = await res.text();
    assert.equal(body, 'hello');
  });

  it('serves an HTML file directly', async () => {
    const res = await fetch('http://localhost:3031/_test-index.html', {
      headers: { 'Connection': 'close' }
    });
    const body = await res.text();
    assert.ok(body.indexOf('<html>') !== -1);
  });

  it('returns correct content-type for text files', async () => {
    const res = await fetch('http://localhost:3031/_test-asset.txt', {
      headers: { 'Connection': 'close' }
    });
    assert.ok(res.headers.get('content-type').includes('text/plain'));
  });
});
