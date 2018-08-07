// Initializes the `stations` service on path `/stations`
const createService = require('feathers-mongoose');
const createModel = require('../../models/stations.model');
const hooks = require('./stations.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/stations', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('stations');

  service.hooks(hooks);
};
