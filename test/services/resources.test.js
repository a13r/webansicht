const assert = require('assert');
const app = require('../../src/app');

describe('\'resources\' service', () => {
  it('registered the service', () => {
    const service = app.service('api/resources');

    assert.ok(service, 'Registered the service');
  });
});
