const _ = require("lodash");
const equal = require("deep-equal");
const logger = require("winston")

module.exports = function () { // eslint-disable-line no-unused-vars
    return async function dedup(hook) {
        if (!hook.id) {
            return;
        }
        const app = require('../app');
        const currentData = await app.service('resources').get(hook.id);
        const newData = _.merge({}, currentData, hook.data);
        // If the new data is equal to the current data (excluding _id), skip further processing
        if (equal(_.omit(newData, '_id'), _.omit(currentData, '_id'))) {
            logger.info(`Skipping change for resource ${hook.id} as data is unchanged.`);
            hook.result = currentData; // Do not apply changes
            return hook;
        }
    };
};
