import AuthStore from './auth';
import JournalStore from './journal';
import LogStore from './log';
import {NotificationStore} from './notification';
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
import {TalkGroupStore} from "~/stores/talkGroups";
import {MapStore} from "~/stores/map";
import {MessageStore} from "~/stores/messages";

export const router = new RouterStore();
export const auth = new AuthStore();
export const notification = new NotificationStore();
export const manageUser = new ManageUserStore();
export const resourceAdmin = new ResourceAdminStore();
export const resources = new ResourceListStore();
export const talkGroups = new TalkGroupStore();

const stores = {
    auth,
    notification,
    router,
    log: new LogStore(),
    resources,
    resourceAdmin,
    journal: new JournalStore(),
    stations: new StationStore(),
    transports: new TransportStore(),
    manageUser,
    importExport: new ImportExportStore(),
    todos: new TodoStore(),
    talkGroups,
    calls: new CallStore(),
    map: new MapStore(),
    messages: new MessageStore()
};
export default stores;

loginReaction(({user}) => {
    if (user.roles.includes('dispo')) {
        bind('f1', '/');
        bind('f2', '/journal');
        bind('f3', '/log');
        bind('f4', '/messages');
        bind('f5', '/resourceAdmin');
        bind('f6', '/stations');
        bind('f7', '/transports');
        bind('f8', '/map');
        bind('ctrl+e', stores.journal.createEntry);
        bind('shift+f6', stores.transports.createNew);
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
    }, {fireImmediately: true});
}
