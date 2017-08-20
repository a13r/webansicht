import {action, computed, observable, reaction, toJS} from "mobx";
import ResourceStore from "./resources";
import {service} from "../app";
import _ from "lodash";

export default class ResourceAdminStore extends ResourceStore {
    emptyResource = {
        state: 0,
        contact: ''
    };

    constructor() {
        super(fields);
    }

    init() {
        this.find();
        reaction(() => this.form.$('type').value, () => this.form.validate());
        reaction(() => this.form.$('callSign').value, () => this.form.validate());
        reaction(() => this.selectedResource, resource => {
            this.form.update(resource);
            this.form.validate();
        }, true);
        reaction(() => this.form.$('hidden').value, hidden => {
            const id = this.form.$('_id').value;
            if (id) {
                service('resources').patch(id, {hidden});
            }
        });
    }

    @action
    createResource = () => {
        this.form.clear();
    };

    @action
    updateList(list) {
        this.list = list;
    }

    remove = () => {
        service('resources').remove(this.form.$('_id').value);
    };

    onSuccess = form => {
        const id = form.$('_id').value;
        if (id) {
            service('resources').patch(form.$('_id').value, form.values());
        } else {
            const newResource = _.assign({}, this.emptyResource, form.values());
            _.unset(newResource, '_id');
            service('resources').create(newResource)
                .then(action(r => {
                    this.list.push(r);
                    this.selectResource(r._id);
                }));
        }
    };
}

const fields = {
    _id: {
        label: 'Ressource'
    },
    type: {
        label: 'Typ *',
        rules: 'required'
    },
    callSign: {
        label: 'Kennung *',
        rules: 'required'
    },
    contact: {
        label: 'Kdt./Fahrer'
    },
    hidden: {
        type: 'checkbox'
    }
};
