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
            try {
                const existing = await context.service.get(context.id);
                if (existing) {
                    history = existing.history || [];
                }
            } catch (error) {
                console.error('could not get existing station object', error);
            }
        }
        history.push(entry);

        context.data.history = history;
        return context;
    };
};
