import {action, observable} from "mobx";
import {loginReaction} from "~/stores";
import {journal} from "~/app";
import _ from "lodash";

export class TransportStore {
    @observable
    list = [];

    constructor() {
        loginReaction(() => this.find());
        journal.on('created', this.onCreated);
        journal.on('updated', this.onUpdated);
        journal.on('patched', this.onUpdated);
        journal.on('removed', this.onRemoved);
    }

    find() {
        journal.find({query: {transport: true, $sort: {createdAt: 1}}}).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        if (!entry.transport) {
            return;
        }
        this.list.push(entry);
        this.list = _.orderBy(this.list, ['createdAt']);
    };

    @action
    onUpdated = entry => {
        if (!entry.transport) {
            _.remove(this.list, {_id: entry._id});
            return;
        }
        const existing = _.find(this.list, {_id: entry._id});
        if (!existing) {
            this.find();
            return;
        }
        _.assign(existing, entry);
        this.list = _.orderBy(this.list, ['createdAt']);
    };

    @action
    onRemoved = ({_id}) => _.remove(this.list, {_id});
}
