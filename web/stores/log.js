import {action, computed, observable, reaction} from "mobx";
import {log} from "../app";
import _ from "lodash";
import {Form} from "mobx-react-form";
import {auth, loginReaction} from '../stores';

export default class LogStore {
    @observable
    list = [];
    @observable
    query = {
        $sort: {
            since: -1
        }
    };
    form;

    constructor() {
        log.on('created', this.onCreated);
        this.form = new Form({fields});
        reaction(() => this.form.$('resource_id').value, id => this.find(id ? {resource_id: id} : {}));
        loginReaction(() => this.find());
    }

    @action
    onCreated = item => {
        this.list.unshift(item);
    };

    find(query = {}) {
        return log.find({query: _.merge({}, this.query, query)}).then(json => this.updateList(json));
    }

    @action
    updateList = list => {
        this.list = list;
    };

    @computed
    get sortOrder() {
        return this.query.$sort.since;
    }

    @action
    toggleSortOrder() {
        this.query.$sort.since = this.query.$sort.since === 1 ? -1 : 1;
        this.find();
    }
}

const fields = {
    resource_id: {
        label: 'Ressource'
    }
};
