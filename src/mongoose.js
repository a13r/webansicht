const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

module.exports = function () {
  const app = this;

  mongoose.Promise = global.Promise;
  mongoose.connect(app.get('mongodb'), { useMongoClient: true });
  autoIncrement.initialize(mongoose.connection);

  app.set('mongooseClient', mongoose);
};
