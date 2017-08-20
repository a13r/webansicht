const resources = require('./resources/resources.service.js');
const audit = require('./audit/audit.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resources);
  app.configure(audit);
};
