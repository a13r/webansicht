import {action, computed, observable, reaction} from "mobx";
import {Form} from "mobx-react-form";
import {changePassword, client, login, registerAuthErrorHandler, users} from "../app";
import validator from "validator";
import {minLength, passwordEqualTo, required} from "../shared/validators";
import _ from "lodash";
import {clearForms, router} from "./index";
import {notification} from '../stores';
import {minLengthIfNew, requiredIf} from "~/shared/validators";

export default class AuthStore {
    @observable
    loggedIn = undefined;
    form;
    changePasswordForm;
    manageUserForm;
    @observable
    user;
    @observable
    token;
    @observable
    userList = [];

    constructor() {
        this.form = new Form({fields: loginFields}, {onSubmit: this.onSubmitLogin, plugins: {vjf: validator}, options: loginOptions});
        this.changePasswordForm = new Form({fields: changePasswordFields}, {onSubmit: this.onSubmitPassword, options});
        this.manageUserForm = new Form({fields: manageUserFields}, {onSubmit: this.onSubmitManageUser});
        client.passport.getJWT().then(this.processToken);
        registerAuthErrorHandler(action(e => {
            console.error(e);
            this.loggedIn = false;
        }));
        reaction(() => this.loggedIn, loggedIn => {
            if (!loggedIn) {
                this.form.clear();
                this.form.$('username').focus();
            } else {
                if (this.isAdmin) {
                    users.find().then(action(users => this.userList = users));
                    users.on('created', action(user => this.userList.push(user)));
                    users.on('patched', this.updateUser);
                    users.on('updated', this.updateUser);
                }
            }
        }, true);
        reaction(() => this.manageUserForm.$('_id').value, id => {
            this.selectUser(id);
        });
    }

    @action
    updateUser = user => {
        const existing = _.find(this.userList, {_id: user._id});
        if (existing) {
            _.assign(existing, user);
            if (this.manageUserForm.$('_id').value === user._id) {
                this.selectUser(user._id);
            }
        } else {
            this.userList.push(user);
        }
    };

    selectUser = _id => {
        if (!_id) {
            this.manageUserForm.clear();
            return;
        }
        const user = _.find(this.userList, {_id});
        if (!user) {
            return;
        }
        this.manageUserForm.clear();
        this.manageUserForm.set({
            admin: user.roles.includes('admin'),
            dispo: user.roles.includes('dispo'),
            station: user.roles.includes('station'),
            ...user
        });
    };

    createUser = () => {
        this.manageUserForm.clear();
    };

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

    onSubmitManageUser = {
        onSuccess: form => {
            const {_id, admin, dispo, station, username, name, initials, password} = form.values();
            const roles = [];
            if (admin) roles.push('admin');
            if (dispo) roles.push('dispo');
            if (station) roles.push('station');

            const data = {roles, username, name, initials};
            if (password.length) {
                data.password = password;
            }
            if (!initials) {
                data.initials = username;
            }
            if (_id) {
                return users.patch(_id, data)
                    .then(user => notification.success(`${user.name} wurde geändert`))
                    .then(() => form.$('_id').input.focus())
                    .catch(error => notification.error(error.message, 'Fehler beim Ändern des Benutzers'));
            } else {
                return users.create(data)
                    .then(() => form.$('_id').input.focus())
                    .then(user => notification.success(`${user.name} wurde erfolgreich erstellt.`))
                    .catch(error => notification.error(error.message, 'Fehler beim Erstellen des Benutzers'));
            }
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

const manageUserFields = {
    _id: {
        label: 'Benutzer'
    },
    admin: {
        label: 'Administrator',
        type: 'checkbox'
    },
    dispo: {
        label: 'Disponent',
        type: 'checkbox',
        related: ['initials']
    },
    station: {
        label: 'SanHiSt',
        type: 'checkbox'
    },
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
        validators: [requiredIf('dispo')]
    },
    password: {
        label: 'Neues Passwort',
        type: 'password',
        validators: [minLengthIfNew(8)],
        related: ['passwordRepeat']
    },
    passwordRepeat: {
        label: 'Neues Passwort (wdh.)',
        type: 'password',
        valudators: [passwordEqualTo('password')]
    }
};

const options = {
    validateOnChange: true
};

const loginOptions = {
    validateOnChange: false,
    validateOnBlur: false
};
