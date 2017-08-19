import {action, computed, observable, reaction} from 'mobx';
import {service} from '../app';
import _ from 'lodash';
import Form from 'mobx-react-form';

export default class ResourceStore {
    @observable
    list = [];
    query = {
        $sort: {
            callSign: 1
        }
    };
    form;
    states = states;

    constructor(fields) {
        fields = fields || formFields;
        this.form = new Form({fields}, {onSubmit: this});
        reaction(() => this.selectedResource, resource => {
            this.form.update(resource);
        }, true);
    }

    @action
    init() {
        service('resources').on('created', action(this.onCreated));
        service('resources').on('updated', action(this.onUpdated));
        service('resources').on('patched', action(this.onUpdated));
        service('resources').on('removed', action(this.onRemoved));
        this.find();
    }

    find(query = {}) {
        _.merge(this.query, query);
        return service('resources')
            .find({query: this.query})
            .then(json => this.updateList(json));
    }

    onCreated = item => {
        this.list.push(item);
        this.list = _.orderBy(this.list, ['callSign']);
    };

    @action
    onUpdated = (data) => {
        const existing = _.find(this.list, {_id: data._id});
        if (existing) {
            _.extend(existing, data);
        }
        if (this.selectedResource._id === data._id) {
            this.form.set(data);
        }
    };

    onRemoved = item => {
        _.remove(this.list, {_id: item._id});
        this.form.clear();
    };

    @action
    updateList(list) {
        this.list = list;
        if (!this.form.$('_id').value && list.length > 0) {
            //this.form.$('_id').set(list[0]._id);
        }
    }

    @action
    selectResource = id => {
        const resource = _.find(this.list, {_id: id});
        if (resource) {
            this.form.update(resource);
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
        return {};
    }

    onSuccess = form => {
        service('resources').patch(form.$('_id').value, form.values());
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
    }
};

const states = {
    1: {
        rowStyle: {
            backgroundColor: '#C1FFC1'
        },
        name: 'Einsatzbereit'
    },
    2: {
        rowStyle: {
            backgroundColor: '#FFD697'
        },
        name: 'zum Berufungsort'
    },
    3: {
        rowStyle: {
            backgroundColor: '#FFAD5B'
        },
        name: 'am Berufungsort'
    },
    4: {
        rowStyle: {
            backgroundColor: '#FFD9FF'
        },
        name: 'zum Zielort'
    },
    5: {
        rowStyle: {
            backgroundColor: '#D6A5E2'
        },
        name: 'am Zielort'
    },
    6: {
        rowStyle: {
            backgroundColor: '#C1FFC1',
            color: '#FF0000'
        },
        name: 'Frei Funk'
    },
    0: {
        rowStyle: {
            backgroundColor: '#FFFFFF',
            color: '#000000'
        },
        name: 'Außer Dienst'
    }
};
