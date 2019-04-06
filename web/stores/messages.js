import React from 'react';
import {action, observable} from 'mobx';
import {loginReaction} from "~/stores/index";
import {messages} from "~/app";
import _ from "lodash";

export class MessageStore {
    @observable
    list = [];

    constructor() {
        loginReaction(({auth}) => {
            if (auth.isDispo) {
                this.find();
                messages.on('created', this.onCreated);
                messages.on('updated', this.onUpdated);
                messages.on('patched', this.onUpdated);
                messages.on('removed', this.onRemoved);
            } else {
                messages.off('created', this.onCreated);
                messages.off('updated', this.onUpdated);
                messages.off('patched', this.onUpdated);
                messages.off('removed', this.onRemoved);
            }
        })
    }

    find() {
        messages.find({query: {$sort: {createdAt: -1}}}).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        this.list.unshift(entry);
    };

    @action
    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (!existing) {
            this.find();
            return;
        }
        _.assign(existing, entry);
    };

    @action
    onRemoved = ({_id}) => _.remove(this.list, {_id});
}
