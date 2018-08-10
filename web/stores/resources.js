import {action, computed, observable, reaction} from "mobx";
import {resources} from "../app";
import _ from "lodash";
import Form from "mobx-react-form";
import validator from "validator";

export default class ResourceStore {
    @observable
    list = [];
    query = {
        $sort: {
            ordering: 1,
            callSign: 1
        }
    };
    form;

    constructor(fields) {
        this.form = new Form({fields}, {hooks: this, plugins: {vjf: validator}, options});
        resources.on('created', this.onCreated);
        resources.on('updated', this.onUpdated);
        resources.on('patched', this.onUpdated);
    }

    find(query = {}) {
        _.merge(this.query, query);
        return resources
            .find({query: this.query})
            .then(action(list => this.list = list));
    }

    @action
    onCreated = item => {
        this.list.push(item);
        this.list = _.orderBy(this.list, ['ordering', 'callSign']);
    };

    @action
    onUpdated = item => {
        const existing = _.find(this.list, {_id: item._id});
        if (existing && existing.hidden === item.hidden) {
            _.extend(existing, item);
            this.list = _.orderBy(this.list, ['ordering', 'callSign']);
        } else {
            this.find();
        }
        if (this.selectedResourceId === item._id) {
            this.form.update(item);
        }
    };

    @computed
    get selectedResourceId() {
        return this.form.$('_id').value;
    }
}

const options = {
    validateOnChange: true
};
