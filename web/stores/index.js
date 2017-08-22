import AuthStore from './auth';
import LogStore from './log';
import ResourcesStore from './resources';
import ResourceAdminStore from './resourceAdmin';
import MobxReactFormDevTools from 'mobx-react-form-devtools';
import {reaction} from 'mobx';
import _ from 'lodash';

class Store {
    auth = new AuthStore();
    log = new LogStore();
    resources = new ResourcesStore();
    resourceAdmin = new ResourceAdminStore();
}

const store = new Store();
export const auth = store.auth;

store.resources.init();
store.resourceAdmin.init();
store.log.init();
window.$store = store;

const forms = {
    resourceEditor: store.resources.form,
    resourceAdmin: store.resourceAdmin.form,
    logFilter: store.log.form,
    loginForm: store.auth.form,
    changePasswordForm: store.auth.changePasswordForm,
    createUserForm: store.auth.createUserForm
};

MobxReactFormDevTools.register(forms);

export function clearForms() {
    _.values(forms).forEach(form => form.clear());
}

export default store;
