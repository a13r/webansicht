const { authenticate } = require('@feathersjs/authentication').hooks;
const createStationHistory = require('../../hooks/create-station-history')();
const {when, isProvider} = require('feathers-hooks-common');


module.exports = {
  before: {
    all: [ when(isProvider('external'), authenticate('jwt')) ],
    find: [],
    get: [],
    create: [createStationHistory],
    update: [createStationHistory],
    patch: [createStationHistory],
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
