const { authenticate } = require('@feathersjs/authentication').hooks;
const {when, isProvider} = require('feathers-hooks-common');
const { restrictToOwner } = require('feathers-authentication-hooks');
const {Forbidden} = require('@feathersjs/errors');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;

const restrict = [
  authenticate('jwt'),
  restrictToAdminOrOwner({
    idField: '_id',
    ownerField: '_id'
  })
];

function restrictToAdminOrOwner(args) {
    return context => {
        const {user} = context.params;
        if (user && user.roles.includes('admin')) {
            return context;
        }

        return restrictToOwner(args)(context);
    }
}

const restrictToAdmin = async context => {
    const {user} = context.params;

    if (!user.roles.includes('admin')) {
        throw new Forbidden('Restricted to admins');
    }

    return context;
};

module.exports = {
  before: {
    all: [],
    find: [ when(isProvider('external'), authenticate('jwt')) ],
    get: [ ...restrict ],
    create: [ when(isProvider('external'), restrictToAdmin), hashPassword() ],
    update: [ ...restrict, hashPassword() ],
    patch: [ ...restrict, when(isProvider('external'), hashPassword()) ],
    remove: [ ...restrict ]
  },

  after: {
    all: [
      protect('password')
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
