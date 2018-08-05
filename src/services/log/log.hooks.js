const {authenticate} = require('@feathersjs/authentication').hooks;
const {populate, when, isProvider} = require('feathers-hooks-common');

const logUserSchema = {
    include: {
        service: 'users',
        nameAs: 'user',
        parentField: 'user_id',
        childField: '_id'
    }
};

module.exports = {
  before: {
    all: [when(isProvider('external'), authenticate('jwt'))],
    find: [],
    get: [],
    create: [populate({schema: logUserSchema})],
    update: [],
    patch: [],
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
