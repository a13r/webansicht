const net = require('net');

const connections = {};

module.exports = function () {
    const app = this;
    const calls = app.service('calls');
    app.get('lardis').radios.forEach(setupRadio);

    function setupRadio(radio) {
        console.log(`connecting to ${radio.name}`);
        const connection = net.createConnection({host: radio.boxIP, port: radio.boxPort});
        connection.on('connect', () => console.log(`connected to ${radio.name}`));
        connection.on('data', buffer => {
            buffer.toString().split('\n').forEach(line => dataReceived(radio, line));
        });
        connection.on('close', () => console.log(`connection to ${radio.name} closed`));
        connections[radio.name] = connection;
    }

    function dataReceived(radio, line) {
        const [action, data] = line.split(':');
        if (action === 'Call') {
            const split = data.split(',');
            const [lardisUserId, lardisUserName, radioPttState, incomingActive, outgoingActive, issi, unknown1, gssi] = split;
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
        }
    }
};
