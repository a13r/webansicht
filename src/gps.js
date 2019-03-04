const gpsd = require('node-gpsd');

module.exports = function () {
    const app = this;
    const config = app.get('gpsd');
    const positions = app.service('positions');
    const myPositionId = positions.find({query: {name: 'MLS'}})
        .then(result => {
            if (result.length > 0) {
                return result[0];
            } else {
                return positions.create({name: 'MLS'});
            }
        })
        .then(position => position._id);

    if (!config || !config.hostname) {
        console.warn('Invalid GPSd config, GPSd client disabled');
        return;
    }

    const listener = new gpsd.Listener(config);
    listener.on('error', e => console.error(e.message));
    listener.on('TPV', ({lat, lon, time}) => {
        myPositionId.then(id => positions.patch(id, {lat, lon, time}));
    });
    listener.connect(() => {
        console.log('Connected to GPSd');
        listener.watch();
    })
};
