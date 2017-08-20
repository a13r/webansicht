import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import socket from 'feathers-socketio/client';
import io from 'socket.io-client';

const instance = feathers()
    .configure(socket(io('http://localhost:3030')))
    .configure(hooks());

export function app() {
    return instance;
}

export function service(name) {
    return instance.service(name);
}

export const audit = service('audit');
