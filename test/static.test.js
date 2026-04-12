const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');

const publicDir = path.resolve(app.get('public'));
const fixtures = ['_test-asset.txt', '_test-index.html'];

describe('Static asset serving', () => {
  let server;

  before(async function() {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, '_test-asset.txt'), 'hello');
    fs.writeFileSync(path.join(publicDir, '_test-index.html'), '<!doctype html><html><body>test</body></html>');
    server = await app.listen(3031);
  });

  after(function(done) {
    for (const f of fixtures) {
      const p = path.join(publicDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    server.close(done);
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
