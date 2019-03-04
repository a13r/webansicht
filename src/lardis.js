const net = require('net');

const connections = {};

module.exports = function () {
    const app = this;
    const calls = app.service('calls');
    const resources = app.service('resources');
    app.get('lardis').radios.forEach(setupRadio);

    function setupRadio(radio) {
        if (connections[radio.name]) {
            console.warn(`already connecting or connected to ${radio.name}`);
            return;
        }
        console.log(`connecting to ${radio.name}`);
        const connection = net.createConnection({host: radio.boxIP, port: radio.boxPort});
        connection.on('connect', () => console.log(`connected to ${radio.name}`));
        connection.on('data', buffer => {
            buffer.toString().split('\n').forEach(line => dataReceived(radio, line));
        });
        connection.on('error', error => {
            console.error(`error during connection to ${radio.name}`, error.code);
        });
        connection.on('close', () => {
            delete connections[radio.name];
            console.log(`connection to ${radio.name} closed, will try to reconnect in 30s`);
            setTimeout(() => setupRadio(radio), 30000);
        });
        connections[radio.name] = connection;
    }

    function dataReceived(radio, line) {
        const [action, data] = line.split(':');
        if (action === 'Call') {
            const split = data.split(',');
            let [lardisUserId, lardisUserName, radioPttState, incomingActive, outgoingActive, issi, unknown1, gssi] = split;
            const prefix = /^232010000/;
            issi = issi.replace(prefix, '');
            gssi = gssi.replace(prefix, '');
            if (Number(incomingActive) === 1) {
                console.log(`[${radio.name}] incoming call from ${issi} on group ${gssi}`);
                calls.create({
                    direction: 'incoming',
                    issi: Number(issi),
                    gssi: Number(gssi)
                });
            }
            if (Number(outgoingActive) === 1) {
                console.log(`[${radio.name}] outgoing call from ${lardisUserName} on group ${gssi}`);
                calls.create({
                    direction: 'outgoing',
                    lardisUserName: lardisUserName.substring(1, lardisUserName.length - 1),
                    gssi: Number(gssi)
                });
            }
        } else if (action === 'Mail') {
            let [id, issi, time, message] = line.split(',');
            message = message.substring(1, message.length - 1);
            console.log(`[${radio.name}] incoming message from ${issi}: ${message}`);
            if (/^\*\d$/.test(message)) {
                resources.patch(null, {state: parseInt(message.substring(1))}, {query: {tetra: issi}});
            }
        }
    }
};
