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

const setUser = [associateCurrentUser(), populate({schema: journalUserSchema})];

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [...setUser],
        update: [...setUser, setNow('updatedAt')],
        patch: [...setUser, setNow('updatedAt')],
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
