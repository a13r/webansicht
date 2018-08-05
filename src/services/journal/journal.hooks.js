const {authenticate} = require('@feathersjs/authentication').hooks;
const {associateCurrentUser} = require('feathers-authentication-hooks');
const {when, isProvider, populate, setNow, stashBefore} = require('feathers-hooks-common');
const createAuditEntry = require('../../hooks/create-audit-entry');

const journalUserSchema = {
    include: {
        service: 'users',
        nameAs: 'user',
        parentField: 'userId',
        childField: '_id'
    }
};

const setUser = [associateCurrentUser(), populate({schema: journalUserSchema})];
const auditLog = when(isProvider('external'), createAuditEntry());

module.exports = {
    before: {
        all: [when(isProvider('external'), authenticate('jwt'))],
        find: [],
        get: [],
        create: [...setUser],
        update: [...setUser, setNow('updatedAt'), stashBefore()],
        patch: [...setUser, setNow('updatedAt'), stashBefore()],
        remove: []
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [auditLog],
        patch: [auditLog],
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
