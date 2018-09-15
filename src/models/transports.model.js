module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const schema = new Schema({
        requester: {type: String},
        priority: {type: Number, default: 0}, // 0 normal, 1 dringend, 2 sofort
        type: {type: Number, default: 0}, // 0 liegend, 1 sitzend, 2 gehfaehig
        hasCompany: {type: Boolean}, // mit Begleitperson
        diagnose: {type: String},
        patient: {
            firstName: {type: String},
            lastName: {type: String},
            insuranceNumber: {type: String}
        },
        destination: {
            station: {type: String},
            hospital: {type: String}
        },
        state: {type: Number, default: 0}, // 0 angefordert, 1 in Durchfuehrung, 2 beendet, 3 storniert
        resourceId: {type: mongooseClient.Schema.Types.ObjectId},
        userId: {type: mongooseClient.Schema.Types.ObjectId},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    });

    return mongooseClient.model('transports', schema);
};
