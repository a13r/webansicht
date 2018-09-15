import React from 'react';
import {action, computed, observable} from 'mobx';
import {TodoForm} from "~/forms/todoForm";
import {loginReaction} from "~/stores/index";
import {todos} from "~/app";
import _ from "lodash";
import moment from "moment";

export class TodoStore {
    @observable
    list = [];
    form = new TodoForm();

    constructor() {
        loginReaction(({auth}) => {
            if (auth.isDispo) {
                this.find();
                todos.on('created', this.onCreated);
                todos.on('updated', this.onUpdated);
                todos.on('patched', this.onUpdated);
                todos.on('removed', this.onRemoved);
            } else {
                todos.off('created', this.onCreated);
                todos.off('updated', this.onUpdated);
                todos.off('patched', this.onUpdated);
                todos.off('removed', this.onRemoved);
            }
        })
    }

    find() {
        todos.find({query: {$sort: {dueDate: 1}}}).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        this.list.push(entry);
        this.list = _.orderBy(this.list, ['dueDate']);
    };

    @action
    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (!existing) {
            this.find();
            return;
        }
        _.assign(existing, entry);
        this.list = _.orderBy(this.list, ['dueDate']);
    };

    @action
    onRemoved = ({_id}) => _.remove(this.list, {_id});

    create = () => {
        this.form.clear();
        this.form.show();
    };

    edit = entry => () => {
        this.form.clear();
        this.form.set(entry);
        let {dueDate} = entry.dueDate;
        dueDate = moment(dueDate).format('L HH:mm');
        this.form.set({dueDate});
        this.form.show();
    };
}
