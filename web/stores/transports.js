import {action, observable} from "mobx";
import {auth, loginReaction, notification} from "~/stores";
import {transports} from "~/app";
import _ from "lodash";
import {TransportForm} from "~/forms/transportForm";

export class TransportStore {
    @observable
    list = [];
    form = new TransportForm();

    constructor() {
        loginReaction(() => this.find());
        transports.on('created', this.onCreated);
        transports.on('updated', this.onUpdated);
        transports.on('patched', this.onUpdated);
        transports.on('removed', this.onRemoved);
    }

    find() {
        transports.find({query: {$sort: {createdAt: 1}}}).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        this.list.push(entry);
        this.list = _.orderBy(this.list, ['createdAt']);
    };

    @action
    onUpdated = entry => {
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

    createNew = () => {
        this.form.clear();
        this.form.set({
            requester: auth.user.name,
            priority: -1,
            type: -1
        });
        this.form.show();
    };

    edit = transport => () => {
        if (this.editAllowed(transport)) {
            this.form.clear();
            this.form.set(transport);
            this.form.show();
        } else {
            notification.error('Dieser Transport kann nicht bearbeitet werden', 'Fremder Transport');
        }
    };

    editAllowed = transport => auth.isDispo || transport.userId === auth.user._id;
}
