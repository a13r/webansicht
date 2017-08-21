const {setNow} = require('feathers-hooks-common');
const createAuditEntry = require('../../hooks/create-audit-entry')();

const updateSince = setNow('since');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [updateSince],
    patch: [updateSince],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [createAuditEntry],
    update: [createAuditEntry],
    patch: [createAuditEntry],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
