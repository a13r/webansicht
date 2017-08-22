import {action, computed, observable, reaction, toJS} from "mobx";
import ResourceStore from "./resources";
import _ from "lodash";
import {resources} from '../app';
import {auth} from '../stores';
import {required} from '../shared/validators';

export default class ResourceAdminStore extends ResourceStore {
    @observable
    editorVisible = false;

    constructor() {
        super(fields);
    }

    init() {
//        reaction(() => this.form.$('type').value, () => this.form.validate());
//        reaction(() => this.form.$('callSign').value, () => this.form.validate());
//        reaction(() => this.form.$('ordering').value, () => this.form.validate());
        reaction(() => this.selectedResource, resource => {
            if (resource) {
                this.form.update(resource);
                this.showEditor(true);
            }
        });
        reaction(() => this.form.$('hidden').value, hidden => {
            const id = this.form.$('_id').value;
            if (id) {
                resources.patch(id, {hidden});
            }
        });
        reaction(() => auth.loggedIn, loggedIn => {
            if (loggedIn) {
                this.find();
            }
        }, true);
    }

    @action
    createResource = () => {
        this.form.reset();
        this.showEditor(true);
    };

    @action
    updateList(list) {
        this.list = list;
    }

    @action
    showEditor(show) {
        this.editorVisible = show;
        if (!show) {
            this.form.reset();
        }
    }

    onSuccess = form => {
        const id = form.$('_id').value;
        if (id) {
            resources.patch(form.$('_id').value, form.values());
        } else {
            const newResource = form.values();
            _.unset(newResource, '_id');
            resources.create(newResource)
                .then(action(r => {
                    this.list.push(r);
                    this.form.clear();
                }));
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
