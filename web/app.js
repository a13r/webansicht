import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import socket from 'feathers-socketio/client';
import io from 'socket.io-client';

const instance = feathers()
    .configure(socket(io()))
    .configure(hooks());

export function app() {
    return instance;
}

function service(name) {
    return instance.service(name);
}

export const log = service('api/log');
export const resources = service('api/resources');
