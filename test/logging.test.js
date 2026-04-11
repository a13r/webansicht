const assert = require('assert');
const Transport = require('winston-transport');
const rp = require('request-promise');
const logger = require('../src/logger');
const app = require('../src/app');

class CaptureTransport extends Transport {
  constructor() {
    super();
    this.messages = [];
  }

  log(info, callback) {
    this.messages.push(info);
    callback();
  }

  clear() {
    this.messages.length = 0;
  }
}

describe('Logging', () => {
  let server;
  let capture;
  let consoleTransport;
  const savedLevel = logger.level;

  before(async function() {
    capture = new CaptureTransport();
    consoleTransport = logger.transports.find(t => t.name === 'console');
    if (consoleTransport) logger.remove(consoleTransport);
    logger.add(capture);
    logger.level = 'info';
    server = await app.listen(3032);
  });

  afterEach(function() {
    capture.clear();
  });

  after(function(done) {
    logger.remove(capture);
    if (consoleTransport) logger.add(consoleTransport);
    logger.level = savedLevel;
    server.close(done);
  });

  it('logs successful service calls', () => {
    return rp({
      method: 'POST',
      url: 'http://localhost:3032/authentication',
      json: true,
      body: { strategy: 'local', username: 'admin', password: 'changeme' }
    }).then(() => {
      const logged = capture.messages.map(m => m.message);
      assert.ok(
        logged.some(m => m.includes('authentication') && m.includes('create')),
        'should log the authentication service call'
      );
    });
  });

  it('logs errors for failed requests', () => {
    return rp({
      method: 'POST',
      url: 'http://localhost:3032/authentication',
      json: true,
      body: { strategy: 'local', username: 'admin', password: 'wrong' }
    }).catch(() => {
      const logged = capture.messages.map(m => m.message);
      assert.ok(
        logged.some(m => m.includes('error')),
        'should log an error for failed authentication'
      );
    });
  });
});
