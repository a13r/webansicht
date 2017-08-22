import AuthStore from './auth';
import LogStore from './log';
import ResourcesStore from './resources';
import ResourceAdminStore from './resourceAdmin';
import MobxReactFormDevTools from 'mobx-react-form-devtools';
import {reaction} from 'mobx';

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

MobxReactFormDevTools.register({resourceEditor: store.resources.form, resourceAdmin: store.resourceAdmin.form});

export default store;
