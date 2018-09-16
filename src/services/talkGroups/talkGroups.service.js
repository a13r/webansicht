// Initializes the `stations` service on path `/stations`
const createService = require('feathers-mongoose');
const createModel = require('../../models/talkGroups.model');
const hooks = require('./talkGroups.hooks');

module.exports = function (app) {
    const Model = createModel(app);

    // Initialize our service with any options it requires
    app.use('/talkGroups', createService({Model}));

    // Get our initialized service so that we can register hooks
    const service = app.service('talkGroups');

    service.hooks(hooks);
};
