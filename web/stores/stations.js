import {action, computed, makeObservable, observable, reaction} from "mobx";
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
            onCreated: action,
            create: action,
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
            .then(action(list => {
                // Reuse the stations already shown, so unsaved edits on their cards survive,
                // and keep stations that were added in the UI but not saved yet
                const unsaved = this.list.filter(s => s.isNew);
                this.list = [...list.map(entry => {
                    const existing = this.list.find(s => s._id === entry._id);
                    if (!existing) return new Station(entry);
                    existing.update(entry);
                    return existing;
                }), ...unsaved];
            }));
    }

    onCreated = action(entry => {
        const existing = this.list.find(s => s._id === entry._id);
        if (existing) {
            existing.update(entry);
        } else {
            // Only adopt an unsaved card that is being submitted right now with the same name:
            // 'created' events also come from other clients and must not take over a card
            // the user is still editing.
            const pending = this.list.find(s => s.isNew && s.form.submitting && s.form.$('name').value === entry.name);
            if (pending) {
                pending._id = entry._id;
                pending.update(entry);
            } else {
                this.list.push(new Station(entry));
            }
        }
        this.list = _.orderBy(this.list, ['ordering', 'name']);
    });

    onUpdated = action(entry => {
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
    });

    onRemoved = action(({_id}) => _.remove(this.list, {_id}));

    selectStation = station => this.selected = station;

    create = () => {
        this.list.push(new Station({name: '', currentPatients: 0, maxPatients: 1}));
    };

    remove = station => action(() => {
        if (station.isNew) {
            _.remove(this.list, s => s === station);
        } else {
            station.reset();
        }
    });

    submitNew = station => e => {
        e.preventDefault();
        station.form.submit();
    };

    setShowDeleted = event => this.showDeleted = !!event.target.checked;
}

export class Station {
    form;
    // stable React key, also for stations that are not saved yet
    key = _.uniqueId('station-');
    _id;
    name;
    contact;
    currentPatients;
    maxPatients;
    ordering;
    deleted;

    constructor(values) {
        makeObservable(this, {
            form: observable.ref,
            _id: observable,
            name: observable,
            contact: observable,
            currentPatients: observable,
            maxPatients: observable,
            ordering: observable,
            deleted: observable,
            isNew: computed,
            loadPercentage: computed,
            loadLabel: computed,
            canWrite: computed,
        });
        _.assign(this, values);
        this.form = new StationForm(this, values);
    }

    // Applies values from the server. While the card has unsaved changes, its form is kept so
    // the user's input isn't lost; pass {replaceForm: true} after the user's own save.
    update(values, {replaceForm = false} = {}) {
        _.assign(this, values);
        if (replaceForm || !this.form.changed) {
            this.form = new StationForm(this, values);
        }
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
                    const data = _.omit(form.values(), '_id');
                    return stations.create(data)
                        .then(action(result => {
                            this.station._id = result._id;
                            this.station.update(result, {replaceForm: true});
                        }))
                        .catch(error => notification.error(error.message, 'Fehler beim Erstellen'));
                } else {
                    // Only send what the user changed, so concurrent changes to other fields of
                    // this station (e.g. by another dispatcher) aren't overwritten with stale values
                    const changes = _.pickBy(form.values(), (value, name) => form.$(name).changed);
                    return stations.patch(this.station._id, changes)
                        .then(action(result => {
                            this.station.update(result, {replaceForm: true});
                        }))
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
    _id: {
        label: 'ID',
        value: null
    },
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
