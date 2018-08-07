import AuthStore from './auth';
import JournalStore from './journal';
import LogStore from './log';
import NotificationStore from './notification';
import ResourceListStore from './resourceList';
import ResourceAdminStore from './resourceAdmin';
import MobxReactFormDevTools from 'mobx-react-form-devtools';
import {RouterStore} from 'mobx-react-router';
import {reaction} from 'mobx';
import _ from 'lodash';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import StationStore from "~/stores/stations";

export const router = new RouterStore();
export const auth = new AuthStore();
export const notification = new NotificationStore();

const stores = {
    auth,
    notification,
    router,
    log: new LogStore(),
    resources: new ResourceListStore(),
    resourceAdmin: new ResourceAdminStore(),
    journal: new JournalStore(),
    stations: new StationStore()
};
export default stores;

const forms = {
    resourceEditor: stores.resources.form,
    resourceAdmin: stores.resourceAdmin.form,
    logFilter: stores.log.form,
    loginForm: stores.auth.form,
    changePasswordForm: stores.auth.changePasswordForm,
    createUserForm: stores.auth.createUserForm,
    journalForm: stores.journal.form
};

MobxReactFormDevTools.register(forms);

loginReaction(() => {
    bind('f1', '/');
    bind('f2', '/journal');
    bind('f3', '/log');
    bind('ctrl+e', stores.journal.createEntry);
    bind('f4', '/resources');
    bind('f5', '/stations');
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

export function clearForms() {
    _.values(forms).forEach(form => form.clear());
}

export function loginReaction(onLogin, onLogout) {
    reaction(() => auth.loggedIn, loggedIn => {
        if (loggedIn) {
            _.isFunction(onLogin) && onLogin();
        } else {
            _.isFunction(onLogout) && onLogout();
        }
    }, true);
}
