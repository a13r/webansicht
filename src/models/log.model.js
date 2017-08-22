const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    resource_id: String,
    callSign: String,
    type: String,
    state: Number,
    since: Date,
    lastPosition: String,
    destination: String,
    contact: String,
    hidden: Boolean,
    ordering: Number,
    user_id: String
});

module.exports = function (app) {
  return mongoose.model('log', schema);
};
