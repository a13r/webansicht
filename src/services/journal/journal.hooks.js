const {authenticate} = require('feathers-authentication').hooks;
const {associateCurrentUser} = require('feathers-authentication-hooks');
const {when, isProvider, populate, setNow} = require('feathers-hooks-common');

const journalUserSchema = {
    include: {
        service: 'users',
        nameAs: 'user',
        parentField: 'userId',
        childField: '_id'
    }
};

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [associateCurrentUser()],
        update: [associateCurrentUser(), setNow('updatedAt')],
        patch: [associateCurrentUser(), setNow('updatedAt')],
        remove: []
    },

    after: {
        all: [populate({schema: journalUserSchema})],
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
