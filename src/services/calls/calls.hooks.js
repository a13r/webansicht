const {authenticate} = require('@feathersjs/authentication').hooks;
const {disallow, when, isProvider, setNow} = require('feathers-hooks-common');

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [disallow('external'), setNow('timestamp')],
        update: [disallow('external')],
        patch: [disallow('external')],
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
