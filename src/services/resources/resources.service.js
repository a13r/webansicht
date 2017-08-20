// Initializes the `resources` service on path `/resources`
const createService = require('feathers-nedb');
const createModel = require('../../models/resources.model');
const hooks = require('./resources.hooks');
const filters = require('./resources.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  const options = {
    name: 'resources',
    Model
  };

  // Initialize our service with any options it requires
  app.use('/resources', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('resources');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
