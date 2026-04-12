const {authenticate} = require('@feathersjs/authentication').hooks;
const {isProvider, setNow, when} = require('feathers-hooks-common');
const createLogEntry = require('../../hooks/create-log-entry')();
const dedup = require('../../hooks/dedup')();
const stateTransitions = require('../../hooks/state-transitions')();

const updateSince = setNow('since');

module.exports = {
  before: {
    all: [when(isProvider('external'), authenticate('jwt'))],
    find: [],
    get: [],
    create: [],
    update: [stateTransitions, updateSince],
    patch: [dedup, stateTransitions, updateSince],
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
