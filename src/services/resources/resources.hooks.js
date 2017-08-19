const {setNow} = require('feathers-hooks-common');

const updateSince = setNow('since');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [updateSince],
    update: [updateSince],
    patch: [updateSince],
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
