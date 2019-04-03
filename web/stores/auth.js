import {action, computed, observable, reaction} from "mobx";
import {client, registerAuthErrorHandler, users} from "../app";
import {router} from "./index";
import {LoginForm} from "~/forms/login";
import {ChangePasswordForm} from "~/forms/changePassword";

export default class AuthStore {
    @observable
    loggedIn = undefined;
    loginForm;
    changePasswordForm;
    @observable
    user;
    @observable
    token;

    constructor() {
        this.loginForm = new LoginForm();
        this.changePasswordForm = new ChangePasswordForm();
        client.passport.getJWT().then(this.processToken);
        registerAuthErrorHandler(action(e => {
            console.error(e);
            this.loggedIn = false;
        }));
        reaction(() => this.loggedIn, loggedIn => {
            if (!loggedIn) {
                this.user = null;
                this.loginForm.clear();
                this.loginForm.$('username').focus();
            }
        }, {fireImmediately: true});
    }

    @computed
    get isAdmin() {
        return this.hasRole('admin');
    }

    @computed
    get isDispo() {
        return this.hasRole('dispo');
    }

    @computed
    get isStation() {
        return this.hasRole('station');
    }

    @computed
    get hasTransports() {
        return this.hasRole('transports');
    }

    hasRole(role) {
        return this.user && this.user.roles.includes(role);
    }

    @action
    logout = () => {
        client.logout();
        // import async to prevent cyclic module dependency
        import('~/forms').then(module => module.clearForms());
        if (router.location.pathname !== '/') {
            router.push('/');
        }
        this.loggedIn = false;
    };

    @action
    processToken = token => {
        if (!token) {
            this.loggedIn = false;
        }
        this.token = token;
        client.passport.verifyJWT(token)
            .then(payload => client.authenticate().then(() => users.get(payload.userId)))
            .then(action(user => {
                this.loggedIn = true;
                this.user = user;
            }))
            .catch(action(error => {
                this.loggedIn = false;
            }));
    };
}
