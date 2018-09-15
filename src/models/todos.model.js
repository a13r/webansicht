module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const {Schema} = mongooseClient;
    const schema = new Schema({
        description: {type: String},
        dueDate: {type: Date},
        userId: {type: mongooseClient.Schema.Types.ObjectId},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}
    });

    return mongooseClient.model('todos', schema);
};
