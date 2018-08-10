import {action, computed, observable, reaction} from "mobx";
import {Form} from "mobx-react-form";
import {client, registerAuthErrorHandler, users} from "../app";
import {passwordEqualTo, required} from "../forms/validators";
import _ from "lodash";
import {clearForms, router} from "./index";
import {notification} from '../stores';
import {minLengthIfNew, requiredIf} from "~/forms/validators";
import {LoginForm} from "~/forms/login";
import {ChangePasswordForm} from "~/forms/changePassword";

export default class AuthStore {
    @observable
    loggedIn = undefined;
    loginForm;
    changePasswordForm;
    manageUserForm;
    @observable
    user;
    @observable
    token;
    @observable
    userList = [];

    constructor() {
        this.loginForm = new LoginForm();
        this.changePasswordForm = new ChangePasswordForm();
        this.manageUserForm = new Form({fields: manageUserFields}, {hooks: this.onSubmitManageUser});
        client.passport.getJWT().then(this.processToken);
        registerAuthErrorHandler(action(e => {
            console.error(e);
            this.loggedIn = false;
        }));
        reaction(() => this.loggedIn, loggedIn => {
            if (!loggedIn) {
                this.loginForm.clear();
                this.loginForm.$('username').focus();
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

    onSubmitManageUser = {
        onSuccess: form => {
            const {_id, admin, dispo, station, username, name, initials, password, stationId} = form.values();
            const roles = [];
            if (admin) roles.push('admin');
            if (dispo) roles.push('dispo');
            if (station) roles.push('station');

            const data = {roles, username, name, initials, stationId};
            if (!stationId) {
                data.stationId = null;
            }
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
    stationId: {
        label: 'Eigene SanHiSt'
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
        validators: [passwordEqualTo('password')]
    }
};
