const {authenticate} = require('@feathersjs/authentication').hooks;
const {when, isProvider} = require('feathers-hooks-common');
const {associateCurrentUser} = require('feathers-authentication-hooks');

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [associateCurrentUser()],
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
