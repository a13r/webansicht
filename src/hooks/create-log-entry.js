const _ = require('lodash');

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
    return function(hook) {
        const app = hook.app;
        const entry = Object.assign({}, hook.result);
        entry.resource_id = entry._id;
        delete entry._id;
        app.service('api/log').create(entry);
    };
};
