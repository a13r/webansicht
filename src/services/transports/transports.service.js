// Initializes the `stations` service on path `/stations`
const { MongooseService } = require('@feathersjs/mongoose');
const createModel = require('../../models/transports.model');
const hooks = require('./transports.hooks');

module.exports = function (app) {
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/transports', new MongooseService({ Model }));

  // Get our initialized service so that we can register hooks
  const service = app.service('transports');

  service.hooks(hooks);
};
