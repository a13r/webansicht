import AuthStore from './auth';
import JournalStore from './journal';
import LogStore from './log';
import NotificationStore from './notification';
import ResourceListStore from './resourceList';
import ResourceAdminStore from './resourceAdmin';
import MobxReactFormDevTools from 'mobx-react-form-devtools';
import {reaction} from 'mobx';
import _ from 'lodash';

export const auth = new AuthStore();
export const notification = new NotificationStore();

const stores = {
    auth,
    notification,
    log: new LogStore(),
    resources: new ResourceListStore(),
    resourceAdmin: new ResourceAdminStore(),
    journal: new JournalStore()
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
