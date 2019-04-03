import {action, observable, reaction} from "mobx";
import {resources} from "../app";
import ResourceStore from "./resources";
import {loginReaction} from "./index";
import _ from "lodash";
import {SendMessageForm} from "~/forms/sendMessageForm";

export default class ResourceListStore extends ResourceStore {
    sendMessageForm = new SendMessageForm();
    @observable
    sendMessageVisible = false;

    constructor() {
        super(fields);
        loginReaction(() => this.find({hidden: false}).then(() => {
            if (this.list.length > 0) {
                this.selectResource(this.list[0]._id);
            }
        }));
        this.sendMessageForm.reset();
        reaction(() => this.form.$('_id').value, _id => {
            const resource = _.find(this.list, {_id});
            if (resource) {
                this.form.clear();
                this.form.update(resource);
                if (this.form.$('state').input) {
                    this.form.$('state').input.focus();
                }
                if (resource.tetra) {
                    this.sendMessageForm.$('destination').set(resource.tetra);
                    this.sendMessageVisible = true;
                    this.sendMessageForm.hasCallout = !!resource.hasCallout;
                    this.sendMessageForm.$('callout').set(!!resource.hasCallout);
                } else {
                    this.sendMessageVisible = false;
                }
            }
        });
    }

    @action
    selectResource = _id => this.form.set({_id});

    onSuccess = form => {
        resources.patch(form.$('_id').value, form.values());
    };

    setHome = field => {
        this.form.$(field).set(this.form.$('home').value);
    };

    swapPositions = () => {
        const tmp = this.form.$('lastPosition').value;
        this.form.$('lastPosition').set(this.form.$('destination').value);
        this.form.$('destination').set(tmp);
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
    },
    home: {
        label: 'Heimatstandort'
    }
};
