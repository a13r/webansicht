const mongoose = require('mongoose');

module.exports = function () {
  const app = this;

  mongoose.Promise = global.Promise;
  mongoose.connect(app.get('mongodb'), { useMongoClient: true });

  app.set('mongooseClient', mongoose);
};
