import {observable, action, computed, reaction} from "mobx";
import {stations} from "~/app";
import _ from "lodash";
import {loginReaction} from "~/stores/index";
import validatorjs from "validatorjs";
import {Form} from "mobx-react-form";

export default class StationStore {
    @observable
    list = [];
    @observable
    selected;
    @observable
    showDeleted = false;

    constructor() {
        stations.on('created', this.onCreated);
        stations.on('updated', this.onUpdated);
        stations.on('patched', this.onUpdated);
        loginReaction(() => this.find());
        reaction(() => this.showDeleted, () => this.find());
    }

    find() {
        stations
            .find({query: {$sort: {ordering: 1, name: 1}, deleted: this.showDeleted ? undefined : false}})
            .then(action(list => this.list = list.map(s => new Station(s))));
    }

    @action
    onCreated = entry => {
        this.list = _.orderBy(this.list.concat(new Station(entry)), ['orderingValue', 'nameValue']);
    };

    @action
    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (existing) {
            existing.form.update(entry);
            if (entry.deleted !== existing.deleted) {
                if (entry.deleted && !this.showDeleted) {
                    _.remove(this.list, {_id: entry._id});
                } else if (this.showDeleted) {
                    this.list = this.list.concat(new Station(entry));
                }
            }
            this.list = _.orderBy(this.list, ['orderingValue', 'nameValue']);
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

    @action
    submitNew = (station, e) => {
        e.preventDefault();
        station.form.submit().then(() => {
            if (station.isNew) {
                this.removeNew(station);
            }
        });
    };

    @action
    setShowDeleted = event => {
        console.log(event.target.checked);
        this.showDeleted = !!event.target.checked;
    };
}

export class Station {
    form;

    constructor(values) {
        this.form = new Form({fields}, {onSubmit: this, plugins: {dvr: validatorjs}});
        this.form.update(values);
    }

    onSuccess = form => {
        const values = _.merge({}, form.values());
        if (!values._id) {
            delete values._id;
            return stations.create(values);
        } else {
            return stations.patch(values._id, values)
                .then(entry => {
                    form.reset();
                    form.update(entry);
                });
        }
    };

    get _id() {
        return this.form.$('_id').value;
    }

    get name() {
        return this.form.$('name');
    }

    @computed
    get nameValue() {
        return this.name.value;
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

    get ordering() {
        return this.form.$('ordering');
    }

    @computed
    get orderingValue() {
        return this.ordering.value;
    }

    get deleted() {
        return this.form.$('deleted');
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
        label: 'Name',
        rules: 'required'
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
    },
    deleted: {
        label: 'ausgeblendet',
        type: 'checkbox'
    }
};
