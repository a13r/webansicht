import {action, computed, observable, reaction, toJS} from "mobx";
import ResourceStore from "./resources";
import _ from "lodash";
import {resources} from "../app";
import {required} from "../shared/validators";
import {loginReaction, notification} from "./index";

export default class ResourceAdminStore extends ResourceStore {
    @observable
    editorVisible = false;

    constructor() {
        super(fields);
        loginReaction(() => this.find());
        reaction(() => this.form.$('hidden').value, hidden => {
            const id = this.form.$('_id').value;
            if (id) {
                resources.patch(id, {hidden});
            }
        });
    }

    @action
    createResource = () => {
        this.form.reset();
        this.showEditor(true);
        setTimeout(() => this.form.$('callSign').input.focus(), 100);
    };

    @action
    showEditor(show) {
        this.editorVisible = show;
        if (!show) {
            this.form.reset();
        }
    }

    @action
    selectResource = _id => {
        const resource = _.find(this.list, {_id});
        if (resource) {
            this.form.update(resource);
            this.showEditor(true);
            setTimeout(() => this.form.$('callSign').input.focus(), 100);
        }
    };

    onSuccess = form => {
        const id = form.$('_id').value;
        if (id) {
            resources.patch(form.$('_id').value, form.values())
                .then(r => notification.success(`Die Ressource ${r.callSign} wurde geändert`));
        } else {
            const newResource = form.values();
            _.unset(newResource, '_id');
            resources.create(newResource)
                .then(action(r => {
                    notification.success(`Die Ressource ${r.callSign} wurde erstellt`);
                    this.form.clear();
                }));
            this.createResource();
        }
    };
}

const fields = {
    _id: {
        label: 'Ressource'
    },
    type: {
        label: 'Typ',
        validators: [required()]
    },
    callSign: {
        label: 'Kennung',
        validators: [required()]
    },
    tetra: {
        label: 'Tetra'
    },
    contact: {
        label: 'Kommandant / Fahrer'
    },
    ordering: {
        label: 'Reihung',
        default: 0,
        type: 'number',
        validators: [required()]
    },
    hidden: {
        type: 'checkbox'
    }
};
