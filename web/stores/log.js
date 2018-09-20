import {action, computed, observable, reaction} from "mobx";
import {log} from "../app";
import _ from "lodash";
import {Form} from "mobx-react-form";
import {loginReaction, router} from '../stores';

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
        log.on('removed', this.onRemoved);
        this.form = new Form({fields});
        reaction(() => this.form.$('resource_id').value, id => this.find(id ? {resource_id: id} : {}));
        loginReaction(() => this.find());
    }

    @action
    onCreated = item => {
        if (this.sortOrder === 1) {
            this.list.push(item);
        } else {
            this.list.unshift(item);
        }
    };

    @action
    onRemoved = ({_id}) => {
        _.remove(this.list, {_id});
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

    @action
    goToResourceId = (resourceId) => () => {
        this.form.$('resource_id').set(resourceId);
        router.push('/log');
    };
}

const fields = {
    resource_id: {
        label: 'Ressource'
    }
};
