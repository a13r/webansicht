import {action, computed, makeAutoObservable, makeObservable, observable, reaction} from "mobx";
import {stations} from "~/app";
import {auth} from "~/stores";
import _ from "lodash";
import {loginReaction, notification} from "~/stores/index";
import {required} from "~/forms/validators";
import {BaseForm} from "~/forms/baseForm";

export default class StationStore {
    list = [];
    selected;
    showDeleted = false;

    constructor() {
        makeObservable(this, {
            list: observable,
            selected: observable,
            showDeleted: observable,
            selectStation: action,
            create: action,
            remove: action,
            submitNew: action,
            setShowDeleted: action,
        });
        stations.on('created', this.onCreated);
        stations.on('updated', this.onUpdated);
        stations.on('patched', this.onUpdated);
        stations.on('removed', this.onRemoved);
        loginReaction(() => this.find());
        reaction(() => this.showDeleted, () => this.find());
    }

    find() {
        stations
            .find({query: {$sort: {ordering: 1, name: 1}, deleted: this.showDeleted ? undefined : false}})
            .then(action(list => this.list = list.map(s => new Station(s))));
    }

    onCreated = entry => {
        this.list = _.orderBy(this.list.concat(new Station(entry)), ['ordering', 'name']);
    };

    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (existing) {
            if (entry.deleted !== existing.deleted) {
                if (entry.deleted && !this.showDeleted) {
                    _.remove(this.list, {_id: entry._id});
                }
            }
            existing.update(entry);
            this.list = _.orderBy(this.list, ['ordering', 'name']);
        } else {
            this.find();
        }
    };

    onRemoved = ({_id}) => _.remove(this.list, {_id});

    selectStation = station => this.selected = station;

    create = () => {
        this.list.push(new Station({name: '', currentPatients: 0, maxPatients: 1}));
    };

    remove = station => () => {
        if (station.isNew) {
            _.remove(this.list, s => s === station);
        } else {
            station.reset();
        }
    };

    submitNew = station => e => {
        e.preventDefault();
        station.form.submit().then(() => {
            if (station.isNew) {
                this.remove(station);
            }
        });
    };

    setShowDeleted = event => this.showDeleted = !!event.target.checked;
}

export class Station {
    form;
    _id;
    name;
    contact;
    currentPatients;
    maxPatients;
    ordering;
    deleted;

    constructor(values) {
        _.assign(this, values);
        this.form = new StationForm(this, values);
    }

    update(values) {
        _.assign(this, values);
        this.form.reset();
        this.form.update(values);
        this.form.validate();
    }

    reset = () => {
        this.form.reset();
    };

    get isNew() {
        return !this._id;
    }

    get loadPercentage() {
        return this.currentPatients / this.maxPatients * 100;
    }

    get loadLabel() {
        return this.currentPatients + '/' + this.maxPatients;
    }

    get canWrite() {
        return auth.isAdmin || auth.isDispo || auth.user.stationId === this._id;
    }
}

export class StationForm extends BaseForm {
    constructor(station, values) {
        super({fields, values});
        makeObservable(this, {
            loadPercentage: computed,
            loadLabel: computed,
        });
        this.station = station;
    }

    hooks() {
        return {
            onSuccess: form => {
                if (!this.station._id) {
                    return stations.create(form.values())
                        .catch(error => notification.error(error.message, 'Fehler beim Erstellen'));
                } else {
                    return stations.patch(this.station._id, form.values())
                        .catch(error => notification.error(error.message, 'Fehler beim Speichern'));
                }
            }
        }
    }

    get loadPercentage() {
        return this.$('currentPatients').value / this.$('maxPatients').value * 100;
    }

    get loadLabel() {
        return this.$('currentPatients').value + '/' + this.$('maxPatients').value;
    }
}

const fields = {
    name: {
        label: 'Name',
        validators: [required()]
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
