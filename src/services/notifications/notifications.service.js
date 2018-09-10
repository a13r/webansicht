const hooks = require('./notifications.hooks');

class NotificationService {
    async create(data, params) {
        return data;
    }
    setup(app, path) {}
}

module.exports = function() {
    const app = this;
    app.use('/notifications', new NotificationService());

    const service = app.service('notifications');
    service.hooks(hooks);
};
