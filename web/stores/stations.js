import {observable} from "mobx";
import {stations} from "~/app";
import _ from "lodash";
import {loginReaction} from "~/stores/index";
import * as validator from "validator";
import {Form} from "mobx-react-form";

export default class StationStore {
    @observable
    list = [];

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
            .then(action(list => this.list = list));
    }

    @action
    onCreated = entry => {
        this.list = _.orderBy(this.list.concat(entry), ['ordering']);
    };

    @action
    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (existing) {
            _.extend(existing, entry);
        } else {
            this.find();
        }
    };

    hooks = {
        onSuccess: form => {

        }
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
