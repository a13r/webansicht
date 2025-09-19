import feathers from "@feathersjs/feathers";
import auth from "@feathersjs/authentication-client";
import socket from "@feathersjs/socketio-client";
import { io } from "socket.io-client";

export const client = feathers()
    .configure(socket(io()))
    .configure(auth({storage: window.localStorage}));

service('notifications').on('created', n => {
    if (n.type === 'reloadClient') {
        window.location.reload();
    }
});

export function service(name) {
    return client.service(name);
}

export const log = service('log');
export const resources = service('resources');
export const users = service('users');
export const journal = service('journal');
export const stations = service('stations');
export const transports = service('transports');
export const todos = service('todos');
export const calls = service('calls');
export const talkGroups = service('talkGroups');
export const positions = service('positions');
export const messages = service('messages');
export const notifications = service('notifications');
