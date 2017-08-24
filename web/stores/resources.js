import {action, computed, observable, reaction} from 'mobx';
import {resources} from '../app';
import _ from 'lodash';
import Form from 'mobx-react-form';
import validator from 'validator';
import {auth} from '../stores';

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

    constructor(fields = formFields) {
        this.form = new Form({fields}, {onSubmit: this, plugins: {vjf: validator}, options: {validateOnChange: true}});
        resources.on('created', action(this.onCreated));
        resources.on('updated', action(this.onUpdated));
        resources.on('patched', action(this.onUpdated));
    }

    init() {
        reaction(() => this.selectedResource, resource => {
            this.form.update(resource);
        }, true);
        reaction(() => auth.loggedIn, loggedIn => {
            if (loggedIn) {
                this.find({hidden: false});
            }
        }, true);
    }

    find(query = {}) {
        _.merge(this.query, query);
        return resources
            .find({query: this.query})
            .then(json => this.updateList(json));
    }

    onCreated = item => {
        this.list.push(item);
        this.list = _.orderBy(this.list, ['ordering', 'callSign']);
    };

    @action
    onUpdated = (data) => {
        const existing = _.find(this.list, {_id: data._id});
        if (existing && existing.hidden === data.hidden) {
            _.extend(existing, data);
            this.list = _.orderBy(this.list, ['ordering', 'callSign']);
        } else {
            this.find();
        }
        if (this.selectedResource && this.selectedResource._id === data._id) {
            this.form.set(data);
        }
    };

    @action
    updateList(list) {
        this.list = list;
        if (!this.form.$('_id').value && list.length > 0) {
            this.form.$('_id').set(list[0]._id);
        }
    }

    @action
    selectResource = id => {
        const resource = _.find(this.list, {_id: id});
        if (resource) {
            this.form.$('_id').set(id);
            if (this.form.$('state')) {
                this.form.$('state').input.focus();
            }
        } else {
            console.error('selected non-existing resource');
        }
    };

    @computed
    get selectedResource() {
        const id = this.form.$('_id').value;
        if (id) {
            return _.find(this.list, {_id: id});
        }
        return null;
    }

    @computed
    get selectedResourceId() {
        return this.form.$('_id').value;
    }

    onSuccess = form => {
        resources.patch(form.$('_id').value, form.values());
    };
}

const formFields = {
    _id: {
        label: 'Ressource'
    },
    state: {
        label: 'Status',
        value: 1
    },
    lastPosition: {
        label: 'Letzter Standort'
    },
    destination: {
        label: 'Zielort'
    },
    contact: {
        label: 'Kdt./Fahrer'
    }
};
