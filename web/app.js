import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import auth from 'feathers-authentication-client';
import socket from 'feathers-socketio/client';
import io from 'socket.io-client';

export const client = feathers()
    .configure(hooks())
    .configure(socket(io()))
    .configure(auth({ storage: window.localStorage }));

export function login({username, password}) {
    return client.authenticate({
        strategy: 'local',
        username,
        password
    });
}

export function registerAuthErrorHandler(handler) {
    client.on('reauthentication-error', handler);
}

function service(name) {
    return client.service(name);
}

export const log = service('log');
export const resources = service('resources');
export const users = service('users');
