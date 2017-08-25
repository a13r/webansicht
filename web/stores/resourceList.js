import {action, reaction} from "mobx";
import {resources} from "../app";
import ResourceStore from "./resources";
import {loginReaction} from "./index";
import _ from "lodash";

export default class ResourceListStore extends ResourceStore {
    constructor() {
        super(fields);
        loginReaction(() => this.find({hidden: false}));
        reaction(() => this.list.length, length => {
            if (length > 0 && !this.form.$('_id').value) {
                this.form.update(this.list[0]);
            }
        });
    }

    @action
    selectResource = _id => {
        const resource = _.find(this.list, {_id});
        if (resource) {
            this.form.update(resource);
            this.form.$('state').input.focus();
        }
    };

    onSuccess = form => {
        resources.patch(form.$('_id').value, form.values());
    };
}

const fields = {
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
    },
    info: {
        label: 'Info'
    }
};
