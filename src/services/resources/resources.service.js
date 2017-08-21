// Initializes the `resources` service on path `/resources`
const createService = require('feathers-mongoose');
const createModel = require('../../models/resources.model');
const hooks = require('./resources.hooks');
const filters = require('./resources.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/api/resources', createService({ Model }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('api/resources');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
