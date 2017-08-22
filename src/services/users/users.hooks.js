const { authenticate } = require('feathers-authentication').hooks;
const {when, discard, isProvider} = require('feathers-hooks-common');
const { restrictToOwner, restrictToRoles } = require('feathers-authentication-hooks');

const { hashPassword } = require('feathers-authentication-local').hooks;
const restrict = [
  authenticate('jwt'),
  restrictToOwner({
    idField: '_id',
    ownerField: '_id'
  })
];

module.exports = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ ...restrict ],
    create: [ restrictToRoles({roles: ['admin']}), hashPassword() ],
    update: [ ...restrict, hashPassword() ],
    patch: [ ...restrict, when(isProvider('external'), hashPassword()) ],
    remove: [ ...restrict ]
  },

  after: {
    all: [
      when(
        hook => hook.params.provider,
        discard('password')
      )
    ],
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
