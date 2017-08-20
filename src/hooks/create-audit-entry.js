module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
    return function createAuditEntry(hook) {
        const app = require('../app');
        const entry = Object.assign({}, hook.result);
        entry.resource_id = entry._id;
        delete entry._id;
        app.service('api/audit').create(entry);
    };
};
