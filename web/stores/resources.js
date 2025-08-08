import {action, computed, makeObservable, observable} from "mobx";
import vjf from 'mobx-react-form/lib/validators/VJF';
import {resources} from "../app";
import _ from "lodash";
import Form from "mobx-react-form";

export default class ResourceStore {
    list = [];
    query = {
        $sort: {
            ordering: 1,
            callSign: 1
        }
    };
    form;

    constructor(fields) {
        makeObservable(this, {
            list: observable,
            onCreated: action,
            onUpdated: action,
            onRemoved: action,
            selectedResourceId: computed,
        });
        this.form = new Form({fields}, {
            hooks: this,
            plugins: {vjf: vjf()},
            options
        });
        resources.on('created', this.onCreated);
        resources.on('updated', this.onUpdated);
        resources.on('patched', this.onUpdated);
        resources.on('removed', this.onRemoved);
    }

    find(query = {}) {
        _.merge(this.query, query);
        return resources
            .find({query: this.query})
            .then(action(list => this.list = list));
    }

    onCreated = item => {
        this.list.push(item);
        this.list = _.orderBy(this.list, ['ordering', 'callSign']);
    };

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

    onRemoved = item => {
        _.remove(this.list, {_id: item._id});
    };

    get selectedResourceId() {
        return this.form.$('_id').value;
    }
}

const options = {
    validateOnChange: true
};
