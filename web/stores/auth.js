import {action, observable, reaction} from "mobx";
import {Form} from "mobx-react-form";
import {login, client, registerAuthErrorHandler, users} from "../app";

export default class AuthStore {
    @observable
    loggedIn = undefined;
    form;
    @observable
    user;

    constructor() {
        this.form = new Form({fields}, {onSubmit: this});
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
        this.loggedIn = false;
    };

    @action
    onSuccess = () => {
        login(this.form.values())
            .then(response => this.processToken(response.accessToken))
            .catch(e => console.error(e.message));
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

    @action
    setUser = user => {
        this.user = user;
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
