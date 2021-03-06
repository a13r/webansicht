// journal-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const journal = new Schema({
        text: {type: String},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},
        reporter: {type: String},
        reportedVia: {type: String},
        direction: {type: String},
        priority: {type: String},
        state: {type: String},
        comment: {type: String},
        transport: {type: Boolean},
        user: {
            username: String,
            name: String,
            initials: String
        },
        auditLog: [{
            changedAt: Date,
            initials: String,
            field: String,
            before: Schema.Types.Mixed,
            after: Schema.Types.Mixed
        }]
    });

    return mongooseClient.model('journal', journal);
};
