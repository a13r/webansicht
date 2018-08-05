// Initializes the `users` service on path `/users`
const createService = require('feathers-mongoose');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');

module.exports = function () {
    const app = this;
    const Model = createModel(app);
    const paginate = app.get('paginate');

    const options = {
      name: 'users',
      Model,
      paginate
    };

    // Initialize our service with any options it requires
    app.use('/users', createService(options));

    // Get our initialized service so that we can register hooks and filters
    const service = app.service('users');

    // create admin user if not exists
    service.find({query: {username: 'admin'}})
        .then(found => {
            if (found.length === 0) {
                service.create({username: 'admin', name: 'Administrator', password: 'changeme', roles: ['admin','dispo']})
                    .then(adminUser => {
                        console.log('admin user not found, created with password changeme');
                    });
            }
        });

    service.hooks(hooks);
};
