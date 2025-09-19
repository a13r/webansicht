const { authenticate } = require('@feathersjs/authentication').hooks;
const {when, isProvider, populate, setNow, stashBefore, setField} = require('feathers-hooks-common');
const createAuditEntry = require('../../hooks/create-audit-entry');

const journalUserSchema = {
    include: {
        service: 'users',
        nameAs: 'user',
        parentField: 'userId',
        childField: '_id'
    }
};

const setUser = [setField({ from: 'params.user._id', as: 'data.userId' }), populate({schema: journalUserSchema})];
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
