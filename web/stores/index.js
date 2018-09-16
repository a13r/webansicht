import AuthStore from './auth';
import JournalStore from './journal';
import LogStore from './log';
import NotificationStore from './notification';
import ResourceListStore from './resourceList';
import ResourceAdminStore from './resourceAdmin';
import {RouterStore} from 'mobx-react-router';
import {reaction} from 'mobx';
import _ from 'lodash';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import StationStore from "~/stores/stations";
import ManageUserStore from "~/stores/manageUser";
import {TransportStore} from "~/stores/transports";
import ImportExportStore from "~/stores/importExport";
import {TodoStore} from "~/stores/todos";
import {CallStore} from "~/stores/calls";

export const router = new RouterStore();
export const auth = new AuthStore();
export const notification = new NotificationStore();
export const manageUser = new ManageUserStore();
export const resourceAdmin = new ResourceAdminStore();

const stores = {
    auth,
    notification,
    router,
    log: new LogStore(),
    resources: new ResourceListStore(),
    resourceAdmin,
    journal: new JournalStore(),
    stations: new StationStore(),
    transports: new TransportStore(),
    manageUser,
    importExport: new ImportExportStore(),
    todos: new TodoStore(),
    calls: new CallStore()
};
export default stores;

loginReaction(({user}) => {
    if (user.roles.includes('dispo')) {
        bind('f1', '/');
        bind('f2', '/journal');
        bind('f3', '/log');
        bind('ctrl+e', stores.journal.createEntry);
        bind('f4', '/resourceAdmin');
        bind('f5', '/stations');
        bind('f6', '/transports');
        bind('ctrl-f6', stores.transports.createNew);
    }
}, () => Mousetrap.reset());

function bind(key, pathOrAction) {
    Mousetrap.bindGlobal(key, (e) => {
        if (_.isFunction(e.preventDefault)) {
            e.preventDefault();
        }
        if (_.isFunction(pathOrAction)) {
            pathOrAction();
        } else {
            router.push(pathOrAction);
        }
    });
}

export function loginReaction(onLogin, onLogout) {
    reaction(() => auth.loggedIn, loggedIn => {
        if (loggedIn) {
            _.isFunction(onLogin) && onLogin({user: auth.user, auth});
        } else {
            _.isFunction(onLogout) && onLogout();
        }
    }, true);
}
