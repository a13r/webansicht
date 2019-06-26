const gpsd = require('node-gpsd');
const _ = require('lodash');

module.exports = function () {
    const app = this;
    const config = app.get('gpsd');
    const positions = app.service('positions');

    function updatePosition({lat, lon, time}) {
        console.log('Updating MLS position to', lat, lon);
        positions.find({query: {name: 'MLS'}})
            .then(result => {
                if (result.length > 0) {
                    return positions.patch(result[0]._id, {lat, lon, time});
                } else {
                    return positions.create({name: 'MLS', lat, lon, time});
                }
            })
            .catch(error => console.log('Could not update MLS position', error));
    }

    if (!config || !config.hostname) {
        console.warn('Invalid GPSd config, GPSd client disabled');
        return;
    }

    const listener = new gpsd.Listener(config);
    listener.on('error', e => {
        // to print errors, use
        // console.error(e.message);
    });
    listener.on('TPV', data => {
        _.throttle(() => updatePosition(data), 30000, {leading: true, trailing: false})();
    });
    listener.connect(() => {
        console.log('Connected to GPSd');
        listener.watch();
    })
};
