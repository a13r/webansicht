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
                this.loginForm.clear();
                this.loginForm.$('username').focus();
            }
        }, true);
    }

    @computed
    get isAdmin() {
        return this.user && this.user.roles.includes('admin');
    }

    @computed
    get isDispo() {
        return this.user && this.user.roles.includes('dispo');
    }

    @computed
    get isStation() {
        return this.user && this.user.roles.includes('station');
    }

    @action
    logout = () => {
        client.logout();
        // import async to prevent cyclic module dependency
        import('~/forms').then(module => module.clearForms());
        router.push('/');
        this.loggedIn = false;
    };

    @action
    processToken = token => {
        if (!token) {
            this.loggedIn = false;
            throw new Error('invalid token');
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
                console.error(error);
            }));
    };
}
