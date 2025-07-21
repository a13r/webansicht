import {action, computed, makeObservable, observable, reaction} from "mobx";
import {log} from "../app";
import _ from "lodash";
import {Form} from "mobx-react-form";
import {loginReaction, router} from '../stores';

export default class LogStore {
    list = [];
    query = {
        $sort: {
            since: -1
        }
    };
    form;

    constructor() {
        makeObservable(this, {
            list: observable,
            query: observable,
            onCreated: action,
            onRemoved: action,
            updateList: action,
            sortOrder: computed,
            toggleSortOrder: action,
            goToResourceId: action,
        });
        log.on('created', this.onCreated);
        log.on('removed', this.onRemoved);
        this.form = new Form({fields});
        reaction(() => this.form.$('resource_id').value, id => this.find(id ? {resource_id: id} : {}));
        loginReaction(() => this.find());
    }

    onCreated = item => {
        if (this.sortOrder === 1) {
            this.list.push(item);
        } else {
            this.list.unshift(item);
        }
    };

    onRemoved = ({_id}) => {
        _.remove(this.list, {_id});
    };

    find(query = {}) {
        return log.find({query: _.merge({}, this.query, query)}).then(json => this.updateList(json));
    }

    updateList = list => {
        this.list = list;
    };

    get sortOrder() {
        return this.query.$sort.since;
    }

    toggleSortOrder() {
        this.query.$sort.since = this.query.$sort.since === 1 ? -1 : 1;
        this.find();
    }

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
