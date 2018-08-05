const mongoose = require('mongoose');

module.exports = function () {
  const app = this;

  mongoose.Promise = global.Promise;
  mongoose.connect(app.get('mongodb'));

  app.set('mongooseClient', mongoose);
};
