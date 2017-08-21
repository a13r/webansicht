const {setNow} = require('feathers-hooks-common');
const createAuditEntry = require('../../hooks/create-audit-entry')();
const fillDefaults = require('../../hooks/fill-defaults')({
    state: 0,
    lastPosition: '',
    destination: '',
    contact: '',
    hidden: false
});

const updateSince = setNow('since');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [updateSince, fillDefaults],
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
