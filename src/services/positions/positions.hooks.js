const {authenticate} = require('@feathersjs/authentication').hooks;
const {populate, when, isProvider} = require('feathers-hooks-common');
const upsert = require('../../hooks/upsert');

const resourceSchema = {
    include: {
        service: 'resources',
        nameAs: 'resource',
        parentField: 'issi',
        childField: 'tetra'
    }
};

const setNameFromResource = ({result}) => {
    if (result.resource && !result.name) {
        result.name = result.resource.name;
    }
};

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [upsert({key: 'issi'})],
        update: [],
        patch: [],
        remove: []
    },

    after: {
        all: [populate({schema: resourceSchema}), setNameFromResource],
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
