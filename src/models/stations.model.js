// stations-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const stations = new Schema({
        name: {type: String, required: true},
        contact: {type: String},
        currentPatients: {type: Number},
        maxPatients: {type: Number},
        ordering: {type: Number}
    }, {
        timestamps: true
    });

    return mongooseClient.model('stations', stations);
};
