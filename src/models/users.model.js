// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const users = new mongooseClient.Schema({

        username: {type: String, unique: true},
        password: {type: String},
        name: {type: String},
        initials: {type: String, unique: true},
        roles: [String],
        stationId: {type: mongooseClient.Schema.Types.ObjectId},

        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now},

        isVerified: Boolean,
        verifyToken: String,
        verifyShortToken: String,
        verifyExpires: Date,
        verifyChanges: [String],
        resetToken: String,
        resetShortToken: String,
        resetExpires: Date
    });

    return mongooseClient.model('users', users);
};
