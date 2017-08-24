import {action, observable, reaction} from "mobx";
import {Form} from "mobx-react-form";
import {changePassword, client, login, registerAuthErrorHandler, users} from "../app";
import validator from "validator";
import {minLength, passwordEqualTo, required} from "../shared/validators";
import _ from "lodash";
import {clearForms} from "./index";

export default class AuthStore {
    @observable
    loggedIn = undefined;
    form;
    changePasswordForm;
    @observable
    user;

    constructor() {
        this.form = new Form({fields}, {onSubmit: this.onSubmitLogin, plugins: {vjf: validator}, options: loginOptions});
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

    @action
    logout = () => {
        client.logout();
        clearForms();
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
                .then(() => form.clear())
                .catch(error => {
                    form.invalidate(error.message);
                });
        }
    };

    onSubmitUser = {
        @action
        onSuccess: form => {
            const newUser = form.values();
            _.unset(newUser, 'passwordRepeat');
            users.create(newUser)
                .then(user => form.clear())
                .catch(error => {
                    form.invalidate(error.message);
                    form.clear();
                });
        }
    };

    @action
    processToken = token => {
        if (!token) {
            this.loggedIn = false;
            return;
        }
        client.passport.verifyJWT(token)
            .then(payload => client.authenticate().then(() => users.get(payload.userId)))
            .then(action(user => {
                this.loggedIn = true;
                this.user = user;
            }));
    };
}

const fields = {
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
