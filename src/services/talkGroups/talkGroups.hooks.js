const {authenticate} = require('@feathersjs/authentication').hooks;
const checkPermissions = require('feathers-permissions');
const {when, isProvider} = require('feathers-hooks-common');

const isAdmin = checkPermissions({roles: ['admin'], field: 'roles'});

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [when(isProvider('external'), isAdmin)],
        update: [when(isProvider('external'), isAdmin)],
        patch: [when(isProvider('external'), isAdmin)],
        remove: [when(isProvider('external'), isAdmin)]
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
