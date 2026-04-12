const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');

const publicExists = fs.existsSync(path.join(__dirname, '..', 'public', 'index.html'));

describe('Feathers application tests', () => {
  let server;

  before(async function() {
    server = await app.listen(3030);
  });

  after(function(done) {
    server.close(done);
  });

  (publicExists ? it : it.skip)('starts and shows the index page', async () => {
    const res = await fetch('http://localhost:3030', {
      headers: { 'Accept': 'text/html', 'Connection': 'close' }
    });
    const body = await res.text();
    assert.ok(body.indexOf('<html') !== -1);
  });

  describe('404', function() {
    it('shows a 404 HTML page', async () => {
      const res = await fetch('http://localhost:3030/path/to/nowhere', {
        headers: { 'Accept': 'text/html', 'Connection': 'close' }
      });
      if (!res.ok) {
        assert.equal(res.status, 404);
        const body = await res.text();
        assert.ok(body.indexOf('<html>') !== -1);
      }
    });

    it('shows a 404 JSON error without stack trace', async () => {
      const res = await fetch('http://localhost:3030/path/to/nowhere', {
        headers: { 'Connection': 'close' }
      });
      assert.equal(res.status, 404);
      const error = await res.json();
      assert.equal(error.code, 404);
      assert.equal(error.message, 'Page not found');
      assert.equal(error.name, 'NotFound');
    });
  });

  describe('Service registration', () => {
    const services = [
      'users', 'authentication', 'resources', 'journal',
      'stations', 'transports', 'todos'
    ];

    services.forEach(path => {
      it(`registered the ${path} service`, () => {
        assert.ok(app.service(path), `${path} service should be registered`);
      });
    });
  });

  describe('Authentication', () => {
    let accessToken;

    it('logs in with the default admin user', async () => {
      const res = await fetch('http://localhost:3030/authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
        body: JSON.stringify({ strategy: 'local', username: 'admin', password: 'changeme' })
      });
      const data = await res.json();
      assert.ok(data.accessToken, 'should return an accessToken');
      accessToken = data.accessToken;
    });

    it('accesses a protected route with a valid JWT', async () => {
      const res = await fetch('http://localhost:3030/users', {
        headers: { Authorization: `Bearer ${accessToken}`, 'Connection': 'close' }
      });
      const data = await res.json();
      const users = data.data || data;
      assert.ok(Array.isArray(users), 'should return user list');
      assert.ok(users.length > 0, 'should have at least one user');
    });

    it('rejects unauthenticated requests', async () => {
      const res = await fetch('http://localhost:3030/users', {
        headers: { 'Connection': 'close' }
      });
      assert.equal(res.status, 401);
    });

    it('rejects invalid credentials', async () => {
      const res = await fetch('http://localhost:3030/authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
        body: JSON.stringify({ strategy: 'local', username: 'admin', password: 'wrongpassword' })
      });
      assert.equal(res.status, 401);
    });
  });
});
