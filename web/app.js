import feathers from "feathers/client";
import hooks from "feathers-hooks";
import auth from "feathers-authentication-client";
import socket from "feathers-socketio/client";
import io from "socket.io-client";
import AuthManagement from "feathers-authentication-management/lib/client";

export const client = feathers()
    .configure(hooks())
    .configure(socket(io()))
    .configure(auth({storage: window.localStorage}));

const authManagement = new AuthManagement(client);

export function login({username, password}) {
    return client.authenticate({
        strategy: 'local',
        username,
        password
    });
}

export function changePassword(username, oldPassword, password) {
    return authManagement.passwordChange(oldPassword, password, {username});
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
export const journal = service('journal');
