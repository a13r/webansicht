// Initializes the `log` service on path `/log`
const createService = require('feathers-mongoose');
const createModel = require('../../models/log.model');
const hooks = require('./log.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/log', createService({ Model }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('log');

  service.hooks(hooks);
};
