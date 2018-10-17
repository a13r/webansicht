// Initializes the `positions` service on path `/positions`
const createService = require('feathers-mongoose');
const createModel = require('../../models/positions.model');
const hooks = require('./positions.hooks');

module.exports = function (app) {
    const Model = createModel(app);

    const options = {
        Model
    };

    // Initialize our service with any options it requires
    app.use('/positions', createService(options));

    // Get our initialized service so that we can register hooks
    const service = app.service('positions');

    service.hooks(hooks);
};
