const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
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

  it('serves a static file', () => {
    return rp('http://localhost:3031/_test-asset.txt').then(body => {
      assert.equal(body, 'hello');
    });
  });

  it('serves an HTML file directly', () => {
    return rp('http://localhost:3031/_test-index.html').then(body => {
      assert.ok(body.indexOf('<html>') !== -1);
    });
  });

  it('returns correct content-type for text files', () => {
    return rp({
      url: 'http://localhost:3031/_test-asset.txt',
      resolveWithFullResponse: true
    }).then(res => {
      assert.ok(res.headers['content-type'].includes('text/plain'));
    });
  });
});
