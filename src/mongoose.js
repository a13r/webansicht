const mongoose = require('mongoose');

module.exports = function () {
  const app = this;

  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGODB_URI || app.get('mongodb'));

  app.set('mongooseClient', mongoose);
};
