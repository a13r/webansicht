const {authenticate} = require('@feathersjs/authentication').hooks;
const {disallow, when, isProvider, setNow, fastJoin, populate} = require('feathers-hooks-common');

const resolvers = {
    joins: {
        resourceId: (...args) => async (call, context) => {
            if (!call.issi) {
                return;
            }
            const found = await context.app.service('resources').find({query: {tetra: call.issi.toString()}});
            if (found.length > 0) {
                context.data.resourceId = found[0]._id;
                context.data.resource = found[0];
            }
        }
    }
};

const loadResource = {
    include: {
        service: 'resources',
        nameAs: 'resource',
        parentField: 'resourceId',
        childField: '_id'
    }
};

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [disallow('external'), setNow('timestamp'), fastJoin(resolvers, {resourceId: true})],
        update: [disallow('external')],
        patch: [disallow('external')],
        remove: []
    },

    after: {
        all: [populate({schema: loadResource})],
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
