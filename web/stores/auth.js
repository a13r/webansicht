import {action, computed, observable, reaction} from "mobx";
import {Form} from "mobx-react-form";
import {changePassword, client, login, registerAuthErrorHandler, users} from "../app";
import validator from "validator";
import {minLength, passwordEqualTo, required} from "../shared/validators";
import _ from "lodash";
import {clearForms, router} from "./index";
import {notification} from '../stores';

export default class AuthStore {
    @observable
    loggedIn = undefined;
    form;
    changePasswordForm;
    @observable
    user;
    @observable
    token;

    constructor() {
        this.form = new Form({fields: loginFields}, {onSubmit: this.onSubmitLogin, plugins: {vjf: validator}, options: loginOptions});
        this.changePasswordForm = new Form({fields: changePasswordFields}, {onSubmit: this.onSubmitPassword, options});
        this.createUserForm = new Form({fields: createUserFields}, {onSubmit: this.onSubmitUser, options});
        client.passport.getJWT().then(this.processToken);
        registerAuthErrorHandler(action(e => {
            console.error(e);
            this.loggedIn = false;
        }));
        reaction(() => this.loggedIn, loggedIn => {
            if (!loggedIn) {
                this.form.clear();
                this.form.$('username').focus();
            }
        }, true);
    }

    @computed
    get isDispo() {
        return this.user && _.indexOf(this.user.roles, 'dispo') >= 0;
    }

    @computed
    get isStation() {
        return this.user && this.user.roles.includes('station');
    }

    @action
    logout = () => {
        client.logout();
        clearForms();
        router.push('/');
        this.loggedIn = false;
    };

    onSubmitLogin = {
        onSuccess: form => {
            login(form.values())
                .then(response => this.processToken(response.accessToken))
                .catch(e => {
                    this.form.$('username').input.focus();
                    this.form.reset();
                    form.invalidate(e.message);
                });
        }
    };

    onSubmitPassword = {
        @action
        onSuccess: form => {
            changePassword(this.user.username, form.$('oldPassword').value, form.$('password').value)
                .then(() => notification.success('Das Passwort wurde geändert'))
                .then(() => clearFormWithoutValidation(form))
                .catch(error => {
                    notification.error(error.message, 'Das Passwort wurde nicht geändert');
                    form.$('oldPassword').clear();
                    form.$('oldPassword').input.focus();
                });
        }
    };

    onSubmitUser = {
        @action
        onSuccess: form => {
            const newUser = form.values();
            _.unset(newUser, 'passwordRepeat');
            users.create(newUser)
                .then(user => notification.success(`${user.name} wurde erfolgreich erstellt.`))
                .then(() => form.$('username').input.focus())
                .then(() => clearFormWithoutValidation(form))
                .catch(error => notification.error(error.message, 'Fehler beim Erstellen des Benutzers'));
        }
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

function clearFormWithoutValidation(form) {
    const oldValue = form.state.options.get('validateOnChange');
    form.state.options.set({validateOnChange: false});
    form.clear();
    form.state.options.set({validateOnChange: oldValue});
}

const loginFields = {
    username: {
        label: 'Benutzername'
    },
    password: {
        label: 'Passwort',
        type: 'password'
    }
};

const changePasswordFields = {
    oldPassword: {
        label: 'Altes Passwort',
        type: 'password'
    },
    password: {
        label: 'Neues Passwort',
        type: 'password',
        validators: [minLength(8)],
        related: ['passwordRepeat']
    },
    passwordRepeat: {
        label: 'Neues Passwort (wiederholen)',
        type: 'password',
        validators: [passwordEqualTo('password')]
    }
};

const createUserFields = {
    username: {
        label: 'Benutzername',
        validators: [required()]
    },
    name: {
        label: 'Name',
        validators: [required()]
    },
    initials: {
        label: 'Kürzel',
        validators: [required()]
    },
    password: {
        label: 'Passwort',
        type: 'password',
        validators: [minLength(8)],
        related: ['passwordRepeat']
    },
    passwordRepeat: {
        label: 'Passwort (wiederholen)',
        type: 'password',
        validators: [passwordEqualTo('password')]
    }
};

const options = {
    validateOnChange: true
};

const loginOptions = {
    validateOnChange: false,
    validateOnBlur: false
};
