const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    callSign: String,
    type: String,
    state: Number,
    since: {type: Date, default: Date.now},
    lastPosition: String,
    destination: String,
    contact: String,
    info: String,
    hidden: Boolean,
    ordering: Number
});

module.exports = function (app) {
    return mongoose.model('resources', schema);
};
