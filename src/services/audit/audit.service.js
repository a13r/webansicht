// Initializes the `audit` service on path `/audit`
const createService = require('feathers-mongoose');
const createModel = require('../../models/audit.model');
const hooks = require('./audit.hooks');
const filters = require('./audit.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/api/audit', createService({ Model }));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('api/audit');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
