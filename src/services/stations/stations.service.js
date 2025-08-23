// Initializes the `stations` service on path `/stations`
const { MongooseService } = require('@feathersjs/mongoose');
const createModel = require('../../models/stations.model');
const hooks = require('./stations.hooks');

module.exports = function (app) {
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/stations', new MongooseService({ Model }));

  // Get our initialized service so that we can register hooks
  const service = app.service('stations');

  service.hooks(hooks);
};
