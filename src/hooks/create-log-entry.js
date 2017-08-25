const _ = require('lodash');

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
    return function(hook) {
        const entry = Object.assign({}, hook.result);
        entry.resource_id = entry._id;
        entry.user_id = _.get(hook, 'params.user._id');
        delete entry._id;
        return hook.app.service('log').create(entry).then(() => hook);
    };
};
