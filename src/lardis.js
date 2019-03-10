const net = require('net');

const connections = {};

module.exports = function () {
    const app = this;
    const calls = app.service('calls');
    const resources = app.service('resources');
    const positions = app.service('positions');
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
            let [id, issi, time, message] = data.split(',');
            message = message.substring(1, message.length - 1);
            console.log(`[${radio.name}] incoming message from ${issi}: ${message}`);
            if (/^\*\d$/.test(message)) {
                resources.patch(null, {state: parseInt(message.substring(1))}, {query: {tetra: issi}});
            }
        } else if (action === 'LIP') {
            let [issi, hex] = data.split(',')
            processLIP(issi, hex);
        }
    }

    function processLIP(issi, hex) {
        const hexMap = {
            '0': '0000',
            '1': '0001',
            '2': '0010',
            '3': '0011',
            '4': '0100',
            '5': '0101',
            '6': '0110',
            '7': '0111',
            '8': '1000',
            '9': '1001',
            'A': '1010',
            'B': '1011',
            'C': '1100',
            'D': '1101',
            'E': '1110',
            'F': '1111'
        };

        function hexToBin(str) {
            return str.split('').map(c => hexMap[c]).join('');
        }

        function extractInt(bin, start, end) {
            return parseInt(bin.substring(start, end), 2);
        }

        console.log(`Received LIP from ${issi}: ${hex}`);

        const bin = hexToBin(hex);
        if (bin[1] !== '0') {
            console.log('skipping long LIP');
            return;
        }
        const timeElapsed = extractInt(bin, 2, 4);
        if (timeElapsed !== 0) {
            console.log(`skipping LIP, time elapsed is ${timeElapsed}`);
            return;
        }
        // positionError = 2 * 10^n
        let positionError = 2 * Math.pow(10, extractInt(bin, 53, 56));
        if (positionError > 200) {
            console.log(`skipping LIP, position error is ${positionError}`);
            return;
        }
        let position = {
            lon: (bin[4] === '0' ? extractInt(bin, 4, 29) : (~extractInt(bin, 4, 29) + 1)) * 360.0 / Math.pow(2, 25),
            lat: (bin[29] === '0' ? extractInt(bin, 29, 53) : (~extractInt(bin, 29, 53) + 1)) * 180.0 / Math.pow(2, 24),
            accuracy: positionError
        };
        if (bin[67] === '0') {
            const reasonForSending = extractInt(bin, 68, 76);
            console.log(`Reason for sending: ${reasonForSending}`);
            if (reasonForSending === 12) {
                console.log(`${issi} has low battery`)
            }
        }
        positions.find({query: {issi}})
            .then(result => {
                if(result.length > 0) {
                    return result[0];
                } else {
                    return positions.create({issi});
                }
            })
            .then(({_id}) => positions.patch(_id, position));
    }
};
