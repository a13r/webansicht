// positions-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const positions = new Schema({
        name: {type: String},
        resourceId: {type: mongooseClient.Schema.Types.ObjectId},
        lat: {type: Number},
        lon: {type: Number},
        time: {type: Date}
    }, {
        timestamps: true
    });

    return mongooseClient.model('positions', positions);
};
