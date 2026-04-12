const _ = require('lodash');

module.exports = function (options = {auditKey: 'auditLog'}) { // eslint-disable-line no-unused-vars
    return async function(hook) {
        const paths = ['text', 'createdAt', 'reporter', 'reportedVia', 'direction', 'priority', 'state', 'comment'];
        const before = _.pick(hook.params.before, paths);
        const after = _.pick(hook.data, paths);
        const changes = paths
            .filter(field => before[field] !== after[field] && (field in before || field in after))
            .map(field => ({ field, lhs: before[field], rhs: after[field] }));
        if (changes.length === 0) {
            return hook;
        }

        const initials = hook.params.user.initials;
        const changedAt = new Date();
        if (!hook.result.auditLog)
            hook.result.auditLog = [];
        changes.map(d => ({
            changedAt, initials, field: d.field, before: d.lhs, after: d.rhs
        })).forEach(d => hook.result.auditLog.push(d));
        console.log(hook.result.auditLog);
        await hook.service.patch(hook.result._id, hook.result);

        return hook;
    };
};
