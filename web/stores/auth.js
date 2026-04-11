import {action, computed, makeObservable, observable, reaction, runInAction} from "mobx";
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
    ssoAvailable = false;

    constructor() {
        makeObservable(this, {
            loggedIn: observable,
            user: observable,
            ssoAvailable: observable,
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
            sessionStorage.setItem('sso-disabled', '1');
            this.loggedIn = false;
            this.user = null;
            this.accessToken = null;
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    _fetchSsoToken = async () => {
        try {
            const response = await fetch('/sso-token');
            return await response.json();
        } catch {
            return {sso: false};
        }
    };

    _authenticateWithSso = async (ssoResult) => {
        const {accessToken, user} = await client.authenticate({
            strategy: 'jwt',
            accessToken: ssoResult.accessToken
        });
        this.userLoggedIn(accessToken, user);
    };

    reAuthenticate = async () => {
        try {
            const {accessToken, user} = await client.reAuthenticate();
            this.userLoggedIn(accessToken, user);
            this._fetchSsoToken().then(result => {
                if (result.accessToken) {
                    runInAction(() => { this.ssoAvailable = true; });
                }
            });
        } catch {
            const ssoDisabled = sessionStorage.getItem('sso-disabled');

            const ssoResult = await this._fetchSsoToken();
            if (ssoResult.accessToken) {
                runInAction(() => { this.ssoAvailable = true; });

                if (!ssoDisabled) {
                    try {
                        await this._authenticateWithSso(ssoResult);
                        return;
                    } catch {
                        // SSO user may not exist locally
                    }
                }
            }

            this.userLoggedOut();
        }
    };

    login = async (credentials) => {
        try {
            const {accessToken, user} = await client.authenticate({
                strategy: 'local',
                ...credentials
            });

            sessionStorage.removeItem('sso-disabled');
            this.userLoggedIn(accessToken, user);

            return {user};
        } catch (error) {
            this.userLoggedOut();
            throw error;
        }
    };

    loginSSO = async () => {
        sessionStorage.removeItem('sso-disabled');
        const ssoResult = await this._fetchSsoToken();
        if (ssoResult.accessToken) {
            await this._authenticateWithSso(ssoResult);
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
