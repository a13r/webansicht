import {action, computed, makeObservable, observable, reaction} from "mobx";
import {client} from "../app";
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
            isAdmin: computed,
            isDispo: computed,
            isStation: computed,
            hasTransports: computed,
            userLoggedIn: action,
            userLoggedOut: action
        });
        this.loginForm = new LoginForm();
        this.changePasswordForm = new ChangePasswordForm();

        this.reAuthenticate();

        client.on('reauthentication-error', action(error => {
            console.error('Authentication error:', error);
            this.loggedIn = false;
            this.user = null;
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

    logout = async () => {
        try {
            await client.logout();
            const module = await import('~/forms');
            module.clearForms();
            if (router.location.pathname !== '/') {
                router.push('/');
            }
            this.loggedIn = false;
            this.user = null;
            this.accessToken = null;
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    reAuthenticate = async () => {
        try {
            // Authenticate using the stored JWT
            const { accessToken, user } = await client.reAuthenticate();
            this.userLoggedIn(accessToken, user);
        } catch (error) {
            this.userLoggedOut();
        }
    };

    login = async (credentials) => {
        try {
            // Authenticate with the provided credentials
            const { accessToken, user } = await client.authenticate({
                strategy: 'local',
                ...credentials
            });

            this.userLoggedIn(accessToken, user);

            return { user };
        } catch (error) {
            this.userLoggedOut();
            throw error;
        }
    };

    userLoggedIn(accessToken, user) {
        this.user = user;
        this.accessToken = accessToken;
        this.loggedIn = true;
    }

    userLoggedOut() {
        this.user = null;
        this.accessToken = null;
        this.loggedIn = false;
    }
}
