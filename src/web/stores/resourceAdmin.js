import {action, computed, observable, reaction, toJS} from "mobx";
import ResourceStore from "./resources";
import {service} from '../app';
import _ from 'lodash';

export default class ResourceAdminStore extends ResourceStore {
    emptyResource = {
        state: 0,
        contact: ''
    };

    constructor() {
        super(fields);
        this.init();
    }

    @action
    createResource = () => {
        this.form.clear();
    };

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
        label: 'Typ'
    },
    callSign: {
        label: 'Kennung'
    },
    contact: {
        label: 'Kdt./Fahrer'
    }
};
