// messages-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const messages = new Schema({
        message: {type: String, required: true},
        destination: {type: String, required: true},
        state: {type: String, enum: ['pending', 'sent', 'delivered', 'error'], required: true, default: 'pending'},
        errorType: {type: String, enum: ['no_radio', 'tetra']},
        callout: {
            severity: Number
        },
        userId: String,
        resource: {type: Object}
    }, {
        timestamps: true
    });

    return mongooseClient.model('messages', messages);
};
