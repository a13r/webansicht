const _ = require("lodash");
const equal = require("deep-equal");

module.exports = function () { // eslint-disable-line no-unused-vars
    return function dedup(hook) {
        if (!hook.id) {
            return;
        }
        return hook.service.get(hook.id)
            .then(currentData => {
                const newData = _.merge({}, currentData, hook.data);
                if (equal(_.omit(newData, '_id'), _.omit(currentData, '_id'))) {
                    throw new Error('Skipping, no change');
                }
            });
    };
};
