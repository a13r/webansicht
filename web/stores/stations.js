import {observable, action, computed} from "mobx";
import {stations} from "~/app";
import _ from "lodash";
import {loginReaction} from "~/stores/index";
import * as validator from "validator";
import {Form} from "mobx-react-form";

export default class StationStore {
    @observable
    list = [];
    @observable
    selected;

    constructor() {
        this.form = new Form({fields}, {onSubmit: this.hooks, plugins: {vjf: validator}});
        stations.on('created', this.onCreated);
        stations.on('updated', this.onUpdated);
        stations.on('patched', this.onUpdated);
        loginReaction(() => this.find());
    }

    find() {
        stations
            .find({query: {$sort: {ordering: 1}}})
            .then(action(list => this.list = list.map(s => new Station(s))));
    }

    @action
    onCreated = entry => {
        this.list = _.orderBy(this.list.concat(new Station(entry)), ['ordering']);
    };

    @action
    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (existing) {
            existing.form.update(entry);
        } else {
            this.find();
        }
    };

    @action
    selectStation = station => this.selected = station;

    create = () => {
        this.list.push(new Station({name: 'Unbenannt'}));
    };

    @action
    removeNew = station => {
        _.remove(this.list, s => s === station);
    };
}

export const StationStoreInstance = new StationStore();

export class Station {
    form;

    constructor(values) {
        this.form = new Form({fields}, {onSubmit: this, plugins: {vjf: validator}});
        this.form.update(values);
    }

    onSuccess = form => {
        const values = _.merge({}, form.values());
        if (!values._id) {
            delete values._id;
            return stations.create(values)
                .then(entry => {
                    form.reset();
                    form.update(entry);
                });
        } else {
            console.log(values);
            return stations.patch(values._id, values)
                .then(entry => {
                    form.reset();
                    form.update(entry);
                });
        }
    };

    get name() {
        return this.form.$('name');
    }

    get contact() {
        return this.form.$('contact');
    }

    get currentPatients() {
        return this.form.$('currentPatients');
    }

    get maxPatients() {
        return this.form.$('maxPatients');
    }

    @computed
    get isNew() {
        return !this.form.$('_id').value;
    }

    @computed
    get loadPercentage() {
        return this.currentPatients.value / this.maxPatients.value * 100;
    }
}

const fields = {
    _id: {
        label: 'ID'
    },
    name: {
        label: 'Name'
    },
    contact: {
        label: 'Kontakt'
    },
    currentPatients: {
        label: 'Patienten aktuell',
        type: 'number'
    },
    maxPatients: {
        label: 'Patienten maximal',
        type: 'number'
    },
    ordering: {
        label: 'Reihenfolge',
        type: 'number'
    }
};
