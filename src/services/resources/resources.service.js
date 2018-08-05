// Initializes the `resources` service on path `/resources`
const createService = require('feathers-mongoose');
const createModel = require('../../models/resources.model');
const hooks = require('./resources.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/resources', createService({ Model }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('resources');

  service.hooks(hooks);
};
