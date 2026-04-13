const _ = require('lodash');
const equal = require("deep-equal");

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
    return async function (hook) {
        const resourceId = hook.result._id;
        const existing = await hook.app.service('log')
            .find({query: {resource_id: resourceId, $limit: 1, $sort: {since: -1}}});
        if (existing.length > 0) {
            const paths = ['tetra', 'callSign', 'type', 'state', 'lastPosition', 'destination', 'contact', 'info', 'hidden'];
            const previous = _.pick(existing[0], paths);
            const current = _.pick(hook.result, paths);
            if (equal(previous, current)) {
                // Do not create log entry if tracked properties did not change
                return;
            }
        }
        const entry = _.omit(hook.result, '_id');
        entry.resource_id = resourceId;
        entry.user_id = _.get(hook, 'params.user._id');
        entry.since = new Date();
        return hook.app.service('log').create(entry).then(() => hook);
    };
};
