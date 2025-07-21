import {action, computed, makeObservable, observable, reaction} from "mobx";
import {client, registerAuthErrorHandler, users} from "../app";
import {router} from "./index";
import {LoginForm} from "~/forms/login";
import {ChangePasswordForm} from "~/forms/changePassword";

export default class AuthStore {
    loginForm;
    changePasswordForm;

    loggedIn = undefined;
    user;
    token;

    constructor() {
        makeObservable(this, {
            loggedIn: observable,
            user: observable,
            token: observable,
            isAdmin: computed,
            isDispo: computed,
            isStation: computed,
            hasTransports: computed,
            logout: action,
            processToken: action
        });
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

    get isAdmin() {
        return this.hasRole('admin');
    }

    get isDispo() {
        return this.hasRole('dispo');
    }

    get isStation() {
        return this.hasRole('station');
    }

    get hasTransports() {
        return this.hasRole('transports');
    }

    hasRole(role) {
        return this.user && this.user.roles.includes(role);
    }

    logout = () => {
        client.logout();
        // import async to prevent cyclic module dependency
        import('~/forms').then(module => module.clearForms());
        if (router.location.pathname !== '/') {
            router.push('/');
        }
        this.loggedIn = false;
    };

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
