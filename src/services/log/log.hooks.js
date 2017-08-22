const {authenticate} = require('feathers-authentication').hooks;
const {populate} = require('feathers-hooks-common');

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
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [populate({schema: logUserSchema})],
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
