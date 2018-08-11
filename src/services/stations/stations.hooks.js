const { authenticate } = require('@feathersjs/authentication').hooks;
const createStationHistory = require('../../hooks/create-station-history');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [],
    get: [],
    create: [createStationHistory()],
    update: [createStationHistory()],
    patch: [createStationHistory()],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
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
