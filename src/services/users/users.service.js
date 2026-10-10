// Initializes the `users` service on path `/users`
const { Service: MongooseService } = require('feathers-mongoose');
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
    app.use('/users', new MongooseService(options));

    // Get our initialized service so that we can register hooks and filters
    const service = app.service('users');

    // create admin user if not exists
    service.find({query: {username: 'admin'}})
        .then(found => {
            if (found.length === 0) {
                service.create({username: 'admin', name: 'Administrator', initials: 'A', password: 'changeme', roles: ['admin','dispo']})
                    .then(adminUser => {
                        console.log('admin user not found, created with password changeme');
                    });
            } else if (!found[0].initials) {
                // admin users created before initials were set by default; update the model
                // directly, the service hooks need an authenticated user
                service.Model.updateOne({_id: found[0]._id}, {initials: 'A'})
                    .then(() => console.log('set initials of admin user to A'))
                    .catch(error => console.error('could not set initials of admin user:', error.message));
            }
        });

    service.hooks(hooks);
};
