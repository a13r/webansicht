module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const schema = new Schema({
        direction: {type: String},
        lardisUserName: {type: String},
        issi: {type: Number},
        gssi: {type: Number},
        timestamp: {type: Date, default: Date.now}
    });

    return mongooseClient.model('calls', schema);
};
