import {action, observable, reaction} from "mobx";
import {audit} from "../app";
import _ from "lodash";
import {Form} from "mobx-react-form";

export default class AuditStore {
    @observable
    list = [];
    query = {
        $sort: {
            since: -1
        }
    };
    form;

    constructor() {
        audit.on('created', this.onCreated);
        this.form = new Form({fields});
        this.find();
        reaction(() => this.form.$('resource_id').value, id => this.find(id ? {resource_id: id} : {}));
    }

    @action
    onCreated = item => {
        this.list.unshift(item);
    };

    find(query = {}) {
        return audit.find({query: _.merge({}, this.query, query)}).then(json => this.updateList(json));
    }

    @action
    updateList = list => {
        this.list = list;
    };
}

const fields = {
    resource_id: {
        label: 'Ressource'
    }
};
