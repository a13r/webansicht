module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
    return function (context) {
        if (options.key) {
            const primaryKeyField = context.service.id;
            const query = {};
            query[options.key] = context.data[options.key];

            return context.service.find({query})
                .then(result => {
                    if (result.length > 0) {
                        // patch
                        return context.service.patch(result[0][primaryKeyField], context.data)
                            .then(patched => {
                                context.result = patched;
                                return context;
                            });
                    }
                });
        }
        return context;
    };
};
