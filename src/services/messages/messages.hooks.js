const { authenticate, setField } = require('@feathersjs/authentication').hooks;
const {populate, when, isProvider} = require('feathers-hooks-common');

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
        create: [setField({ from: 'params.user._id', as: 'data.userId' }), populate({schema: resourceSchema})],
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
