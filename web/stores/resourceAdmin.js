import {action, computed, observable, reaction, toJS} from "mobx";
import ResourceStore from "./resources";
import _ from "lodash";
import {resources} from "../app";
import {required} from "../forms/validators";
import {loginReaction, notification} from "./index";
import {DeleteResourceForm} from "~/forms/deleteResourceForm";

export default class ResourceAdminStore extends ResourceStore {
    @observable
    editorVisible = false;
    deleteResourceForm;

    constructor() {
        super(fields);
        this.deleteResourceForm = new DeleteResourceForm();
        loginReaction(() => this.find(), () => {
            this.editorVisible = false;
            this.deleteResourceForm.hide();
        });
        reaction(() => this.form.$('hidden').value, hidden => {
            if (this.selectedResource && this.selectedResource.hidden !== hidden) {
                resources.patch(this.selectedResourceId, {hidden});
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
            this.form.clear();
            this.form.set(resource);
            this.form.validate();
            this.showEditor(true);
            setTimeout(() => this.form.$('callSign').input.focus(), 100);
        }
    };

    @computed
    get selectedResource() {
        return _.find(this.list, {_id: this.selectedResourceId});
    }

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

    showDeleteModal = () => {
        this.deleteResourceForm.show(this.selectedResource);
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
    },
    home: {
        label: 'Heimatstandort'
    }
};
