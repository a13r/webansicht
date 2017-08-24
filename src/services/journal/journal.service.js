// Initializes the `journal` service on path `/journal`
const createService = require('feathers-mongoose');
const createModel = require('../../models/journal.model');
const hooks = require('./journal.hooks');
const filters = require('./journal.filters');

module.exports = function () {
  const app = this;
  const Model = createModel(app);

  const options = {
    name: 'journal',
    Model
  };

  // Initialize our service with any options it requires
  app.use('/journal', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('journal');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
