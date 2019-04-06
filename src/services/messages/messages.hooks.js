const {authenticate} = require('@feathersjs/authentication').hooks;
const {populate, when, isProvider} = require('feathers-hooks-common');
const {associateCurrentUser} = require('feathers-authentication-hooks');

const resourceSchema = {
    include: {
        service: 'resources',
        nameAs: 'resource',
        parentField: 'destination',
        childField: 'tetra'
    }
};

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [associateCurrentUser(), populate({schema: resourceSchema})],
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
