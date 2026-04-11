const assert = require('assert');
const app = require('../../src/app');

describe('\'resources\' service', () => {
  it('registered the service', () => {
    const service = app.service('resources');

    assert.ok(service, 'Registered the service');
  });
});
