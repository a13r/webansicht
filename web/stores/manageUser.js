import {action, makeObservable, observable, reaction} from "mobx";
import {loginReaction} from "~/stores";
import {users} from "~/app";
import _ from "lodash";
import {ManageUserForm} from "~/forms/manageUserForm";

export default class ManageUserStore {
    form;
    userList = [];

    constructor() {
        makeObservable(this, {
            userList: observable,
            addUser: action,
            updateUser: action,
            removeUser: action,
            selectUser: action,
            createUser: action,
        });
        this.form = new ManageUserForm();
        loginReaction(({auth}) => {
            if (auth.isAdmin) {
                users.find().then(action(users => this.userList = users));
                users.on('created', this.addUser);
                users.on('patched', this.updateUser);
                users.on('updated', this.updateUser);
                users.on('removed', this.removeUser);
            } else {
                this.userList = [];
                users.off('created', this.addUser);
                users.off('patched', this.updateUser);
                users.off('updated', this.updateUser);
                users.off('removed', this.removeUser);
            }
        });
        reaction(() => this.form.$('_id').value, id => {
            this.selectUser(id);
        });
    }

    addUser = user => this.userList.push(user);

    updateUser = user => {
        const existing = _.find(this.userList, {_id: user._id});
        if (existing) {
            _.assign(existing, user);
            if (this.form.$('_id').value === user._id) {
                this.selectUser(user._id);
            }
        } else {
            this.userList.push(user);
        }
    };

    removeUser = ({_id}) => {
        _.remove(this.userList, {_id});
        if (this.form.$('_id').value === _id) {
            this.form.clear();
        }
    };

    selectUser = _id => {
        if (!_id) {
            this.createUser();
            return;
        }
        const user = _.find(this.userList, {_id});
        if (!user) {
            return;
        }
        this.form.clear();
        this.form.set({
            admin: user.roles.includes('admin'),
            dispo: user.roles.includes('dispo'),
            station: user.roles.includes('station'),
            transports: user.roles.includes('transports'),
            ...user
        });
    };

    createUser = () => this.form.clear();
}
