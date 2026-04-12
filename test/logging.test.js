import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Transport = require('winston-transport');
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

  beforeAll(async () => {
    capture = new CaptureTransport();
    consoleTransport = logger.transports.find(t => t.name === 'console');
    if (consoleTransport) logger.remove(consoleTransport);
    logger.add(capture);
    logger.level = 'info';
    server = await app.listen(3032);
  });

  afterEach(() => {
    capture.clear();
  });

  afterAll(() => {
    logger.remove(capture);
    if (consoleTransport) logger.add(consoleTransport);
    logger.level = savedLevel;
    return new Promise(resolve => server.close(resolve));
  });

  it('logs successful service calls', async () => {
    await fetch('http://localhost:3032/authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
      body: JSON.stringify({ strategy: 'local', username: 'admin', password: 'changeme' })
    });
    const logged = capture.messages.map(m => m.message);
    assert.ok(
      logged.some(m => m.includes('authentication') && m.includes('create')),
      'should log the authentication service call'
    );
  });

  it('logs errors for failed requests', async () => {
    await fetch('http://localhost:3032/authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' },
      body: JSON.stringify({ strategy: 'local', username: 'admin', password: 'wrong' })
    });
    const logged = capture.messages.map(m => m.message);
    assert.ok(
      logged.some(m => m.includes('error')),
      'should log an error for failed authentication'
    );
  });
});
