// Initializes the `stations` service on path `/stations`
const createService = require('feathers-mongoose');
const createModel = require('../../models/calls.model');
const hooks = require('./calls.hooks');
const todoNotifier = require('../../hooks/todo-notifier');

module.exports = function (app) {
    const Model = createModel(app);

    // Initialize our service with any options it requires
    app.use('/calls', createService({Model}));

    // Get our initialized service so that we can register hooks
    const service = app.service('calls');
    service.find({query: {dueDate: {$gt: new Date().getTime()}}}).then(calls => {
        calls.forEach(todo => todoNotifier.schedule({data: todo, app}));
    });

    service.hooks(hooks);
};
