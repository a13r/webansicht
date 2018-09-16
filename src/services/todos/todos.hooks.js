const { authenticate } = require('@feathersjs/authentication').hooks;
const {when, isProvider, populate, setNow} = require('feathers-hooks-common');
const {associateCurrentUser} = require('feathers-authentication-hooks');
const todoNotifier = require('../../hooks/todo-notifier');

const loadResource = {
    include: [{
        service: 'users',
        nameAs: 'user',
        parentField: 'userId',
        childField: '_id'
    }]
};

module.exports = {
  before: {
    all: [ when(isProvider('external'), authenticate('jwt')) ],
    find: [],
    get: [],
    create: [setNow('createdAt'), associateCurrentUser()],
    update: [setNow('updatedAt')],
    patch: [setNow('updatedAt')],
    remove: []
  },

  after: {
    all: [populate({schema: loadResource})],
    find: [],
    get: [],
      create: [todoNotifier.schedule],
      update: [todoNotifier.schedule],
      patch: [todoNotifier.schedule],
      remove: [todoNotifier.unschedule]
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
