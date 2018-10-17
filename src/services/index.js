const resources = require('./resources/resources.service.js');
const log = require('./log/log.service.js');
const users = require('./users/users.service.js');
const journal = require('./journal/journal.service.js');
const stations = require('./stations/stations.service.js');
const notifications = require('./notifications/notifications.service.js');
const transports = require('./transports/transports.service.js');
const todos = require('./todos/todos.service.js');
const calls = require('./calls/calls.service.js');
const talkGroups = require('./talkGroups/talkGroups.service.js');
const positions = require('./positions/positions.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resources);
  app.configure(log);
  app.configure(users);
  app.configure(journal);
  app.configure(stations);
  app.configure(notifications);
  app.configure(transports);
  app.configure(todos);
    app.configure(calls);
    app.configure(talkGroups);
    app.configure(positions);
};
