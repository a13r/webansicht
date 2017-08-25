const autoIncrement = require('mongoose-auto-increment');

// journal-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const journal = new Schema({
        serial: {type: Number},
        text: {type: String},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
        reporter: {type: String},
        reportedVia: {type: String},
        direction: {type: String},
        priority: {type: String},
        state: {type: String},
        comment: {type: String},
        user: {
            username: String,
            name: String,
            initials: String
        }
    });

    journal.plugin(autoIncrement.plugin, {model: 'journal', field: 'serial', startAt: 1});

    return mongooseClient.model('journal', journal);
};