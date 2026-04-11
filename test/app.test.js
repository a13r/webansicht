const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
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

  (publicExists ? it : it.skip)('starts and shows the index page', () => {
    return rp({
      url: 'http://localhost:3030',
      headers: { 'Accept': 'text/html' }
    }).then(body =>
      assert.ok(body.indexOf('<html') !== -1)
    );
  });

  describe('404', function() {
    it('shows a 404 HTML page', () => {
      return rp({
        url: 'http://localhost:3030/path/to/nowhere',
        headers: {
          'Accept': 'text/html'
        }
      }).catch(res => {
        assert.equal(res.statusCode, 404);
        assert.ok(res.error.indexOf('<html>') !== -1);
      });
    });

    it('shows a 404 JSON error without stack trace', () => {
      return rp({
        url: 'http://localhost:3030/path/to/nowhere',
        json: true
      }).catch(res => {
        assert.equal(res.statusCode, 404);
        assert.equal(res.error.code, 404);
        assert.equal(res.error.message, 'Page not found');
        assert.equal(res.error.name, 'NotFound');
      });
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

    it('logs in with the default admin user', () => {
      return rp({
        method: 'POST',
        url: 'http://localhost:3030/authentication',
        json: true,
        body: { strategy: 'local', username: 'admin', password: 'changeme' }
      }).then(res => {
        assert.ok(res.accessToken, 'should return an accessToken');
        accessToken = res.accessToken;
      });
    });

    it('accesses a protected route with a valid JWT', () => {
      return rp({
        url: 'http://localhost:3030/users',
        json: true,
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => {
        const users = res.data || res;
        assert.ok(Array.isArray(users), 'should return user list');
        assert.ok(users.length > 0, 'should have at least one user');
      });
    });

    it('rejects unauthenticated requests', () => {
      return rp({
        url: 'http://localhost:3030/users',
        json: true
      }).then(() => {
        assert.fail('should have been rejected');
      }).catch(res => {
        assert.equal(res.statusCode, 401);
      });
    });

    it('rejects invalid credentials', () => {
      return rp({
        method: 'POST',
        url: 'http://localhost:3030/authentication',
        json: true,
        body: { strategy: 'local', username: 'admin', password: 'wrongpassword' }
      }).then(() => {
        assert.fail('should have been rejected');
      }).catch(res => {
        assert.equal(res.statusCode, 401);
      });
    });
  });
});
