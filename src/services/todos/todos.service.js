// Initializes the `stations` service on path `/stations`
const createService = require('feathers-mongoose');
const createModel = require('../../models/todos.model');
const hooks = require('./todos.hooks');

module.exports = function (app) {
  const Model = createModel(app);

  // Initialize our service with any options it requires
  app.use('/todos', createService({Model}));

  // Get our initialized service so that we can register hooks
  const service = app.service('todos');

  service.hooks(hooks);
};
