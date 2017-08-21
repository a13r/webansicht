const {setNow} = require('feathers-hooks-common');
const createLogEntry = require('../../hooks/create-log-entry')();

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
    create: [createLogEntry],
    update: [createLogEntry],
    patch: [createLogEntry],
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
