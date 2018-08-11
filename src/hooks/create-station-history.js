module.exports = function () { // eslint-disable-line no-unused-vars
    return async function (context) {
        const {currentPatients, maxPatients} = context.data;
        const entry = {
            timestamp: new Date,
            currentPatients,
            maxPatients
        };

        let history = [];
        if (context.id) {
            const existing = await context.service.get(context.id);
            if (existing) {
                history = existing.history || [];
            }
        }
        history.push(entry);

        context.data.history = history;
        return context;
    };
};
