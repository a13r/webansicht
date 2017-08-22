const resources = require('./resources/resources.service.js');
const log = require('./log/log.service.js');
const users = require('./users/users.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resources);
  app.configure(log);
  app.configure(users);
};
