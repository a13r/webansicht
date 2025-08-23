// Initializes the `stations` service on path `/stations`
const csvParse = require('csv').parse;
const fs = require('fs');
const { MongooseService } = require('@feathersjs/mongoose');
const createModel = require('../../models/talkGroups.model');
const hooks = require('./talkGroups.hooks');

module.exports = function (app) {
    const Model = createModel(app);

    // Initialize our service with any options it requires
  app.use('/talkGroups', new MongooseService({ Model }));

    // Get our initialized service so that we can register hooks
    const service = app.service('talkGroups');

    service.hooks(hooks);

    const importPath = app.get('talkGroupsCsv');
    if (importPath) {
        service.find()
            .then(found => {
                if (found.length === 0) {
                    importTalkGroups();
                }
            });

        function importTalkGroups() {
            fs.createReadStream(importPath)
                .on('error', error => {
                    console.error(error);
                })
                .pipe(csvParse({delimiter: ';'}))
                .on('data', row => {
                    const [name, gssi] = row;
                    service.create({name, gssi});
                })
                .on('error', error => {
                    console.error(error);
                })
                .on('end', () => console.log('Talk groups imported'));
        }
    }
};
