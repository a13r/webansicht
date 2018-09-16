const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: String,
    gssi: Number
});

module.exports = function (app) {
    return mongoose.model('talkGroups', schema);
};
