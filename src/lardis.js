const net = require('net');
const _ = require('lodash');

const connectedRadios = {};

module.exports = function () {
    const app = this;
    const calls = app.service('calls');
    const resources = app.service('resources');
    const positions = app.service('positions');
    const messages = app.service('messages');
    const notifications = app.service('notifications');
    app.get('lardis').radios.forEach(setupRadio);
    const callOutCC = app.get('callOutCC');

    function setupRadio(radio) {
        if (connectedRadios[radio.name]) {
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
            delete connectedRadios[radio.name];
            console.log(`connection to ${radio.name} closed, will try to reconnect in 30s`);
            setTimeout(() => setupRadio(radio), 30000);
        });
        const {sendMessages, sendCallouts} = radio;
        connectedRadios[radio.name] = {connection, sendMessages, sendCallouts};
    }

    messages.on('created', m => {
        let destination = m.destination;
        if (m.callout) {
            const radio = _.values(connectedRadios).find(r => r.sendCallouts);
            if (!radio) {
                console.error('No radio available for callouts');
                messages.patch(m._id, {state: 'error', errorType: 'no_radio'});
                return;
            }
            const command = `Callout=${m._id},${destination},1,,${m.callout.severity},1,"${m.message}"\r`;
            radio.connection.write(command, 'utf8', () => {
                messages.patch(m._id, {state: 'pending'});
            });
            if (callOutCC && callOutCC.length > 0) {
                resources.find({query: {tetra: destination}}).then(([resource]) => {
                    callOutCC.forEach(issi => {
                        messages.create({
                            message: `Alarmierung an ${resource.type} ${resource.callSign}: ${m.message}`,
                            destination: issi
                        });
                    });
                });
            }
        } else {
            const radio = _.values(connectedRadios).find(r => r.sendMessages);
            if (!radio) {
                console.error('No radio available for messages');
                messages.patch(m._id, {state: 'error', errorType: 'no_radio'});
                return;
            }
            const command = `SendMail=${m._id},${destination},0,"${m.message}"\r`;
            radio.connection.write(command, 'utf8', () => {
                messages.patch(m._id, {state: 'pending'});
            });
        }
    });

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
                resources.find({query: {tetra: issi}}).then(result => {
                    if (result.length === 1) {
                        resources.patch(result[0]._id, {state: parseInt(message.substring(1))}).catch();;
                    }
                });
            }
        } else if (action === 'LIP') {
            let [issi, hex] = data.split(',');
            processLIP(issi, hex);
        } else if (action === 'MailState') {
            const [id, state] = data.split(',');
            console.log(line);
            switch (state) {
                case '1':
                    messages.patch(id, {state: 'sent'});
                    break;
                case '2':
                    messages.patch(id, {state: 'delivered'});
                    break;
                default:
                    messages.patch(id, {state: 'error', errorType: 'tetra'});
                    break;
            }
        } else if (action === 'CalloutAck') {
            const [issi, text] = data.split(',');
            resources.find({query: {tetra: issi}}).catch(() => false)
                .then(result => {
                    const name = result.length > 0 ? `${result[0].type} ${result[0].callSign}` : issi;
                    messages.patch(null, {callout: {ackReceived: Date.now()}}, {
                        query: {
                            destination: issi,
                            callout: {
                                severity: 1
                            },
                            $limit: 1,
                            $sort: {
                                createdAt: -1
                            }
                        }
                    });
                    notifications.create({
                        type: 'showNotification',
                        data: {
                            title: `Callout-Rückmeldung von ${name}`,
                            message: text,
                            level: 'info'
                        }
                    });
                });
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
        let position = {
            lon: (bin[4] === '0' ? extractInt(bin, 4, 29) : (~extractInt(bin, 4, 29) + 1)) * 360.0 / Math.pow(2, 25),
            lat: (bin[29] === '0' ? extractInt(bin, 29, 53) : (~extractInt(bin, 29, 53) + 1)) * 180.0 / Math.pow(2, 24),
            accuracy: positionError
        };
        if (bin[67] === '0') {
            const reasonForSending = extractInt(bin, 68, 76);
            console.log(`Reason for sending: ${reasonForSending}`);
            if (reasonForSending === 12) {
                console.log(`${issi} has low battery`);
                resources.find({query: {tetra: issi}}).catch(() => false)
                    .then(result => {
                        const name = result.length > 0 ? `${result[0].type} ${result[0].callSign}` : issi;
                        notifications.create({
                            type: 'showNotification',
                            data: {
                                title: `${name}: Akku fast leer`,
                                level: 'warning'
                            }
                        });
                    });
            }
        }
        positions.find({query: {issi}})
            .then(result => {
                if (result.length > 0) {
                    return positions.patch(result[0]._id, position);
                } else {
                    return positions.create({issi, ...position});
                }
            });
    }
};
