const _ = require('lodash');

const isEmpty = value => value === undefined || value === null || value === '';

// The stored entry has Date objects, the request data ISO strings; an empty form field ('')
// means the same as a field that was never set
function sameValue(a, b) {
    if (isEmpty(a) || isEmpty(b)) return isEmpty(a) && isEmpty(b);
    if (a instanceof Date || b instanceof Date) return new Date(a).getTime() === new Date(b).getTime();
    return a === b;
}

module.exports = function (options = {auditKey: 'auditLog'}) { // eslint-disable-line no-unused-vars
    return async function(hook) {
        const paths = ['text', 'createdAt', 'reporter', 'reportedVia', 'direction', 'priority', 'state', 'comment'];
        const before = _.pick(hook.params.before, paths);
        const after = _.pick(hook.data, paths);
        // A patch only changes the fields it contains
        const fields = hook.method === 'patch' ? paths.filter(field => field in after) : paths;
        const changes = fields
            .filter(field => !sameValue(before[field], after[field]))
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
