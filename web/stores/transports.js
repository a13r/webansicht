import {action, computed, makeObservable, observable} from "mobx";
import {auth, loginReaction, notification} from "~/stores";
import {transports} from "~/app";
import _ from "lodash";
import {TransportForm} from "~/forms/transportForm";
import {priorities} from "~/shared/strings";

export class TransportStore {
    list = [];
    form = new TransportForm();

    constructor() {
        makeObservable(this, {
            list: observable,
            onCreated: action,
            onRemoved: action,
            onUpdated: action,
            existNewTransports: computed,
        });
        loginReaction(({auth}) => {
            this.find();
            if (auth.isDispo) {
                transports.on('created', this.showNotification);
            } else {
                transports.off('created', this.showNotification);
            }
        });
        transports.on('created', this.onCreated);
        transports.on('updated', this.onUpdated);
        transports.on('patched', this.onUpdated);
        transports.on('removed', this.onRemoved);
    }

    find() {
        transports.find({query: {$sort: {createdAt: 1}}}).then(action(t => this.list = t));
    }

    onCreated = entry => {
        this.list.push(entry);
        this.list = _.orderBy(this.list, ['createdAt']);
    };

    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (!existing) {
            this.find();
            return;
        }
        _.assign(existing, entry);
        this.list = _.orderBy(this.list, ['createdAt']);
    };

    onRemoved = ({_id}) => _.remove(this.list, {_id});

    showNotification = entry => {
        const title = 'Neue Transportanforderung';
        let body = `Dringlichkeit: ${priorities[entry.priority]}`;
        if (entry.diagnose) {
            body += `, Verdachtsdiagnose: ${entry.diagnose}`;
        }
        if (entry.priority === 2) {
            notification.error(body, title);
        } else if (entry.priority === 1) {
            notification.warning(body, title);
        } else {
            notification.info(body, title);
        }
        if (Notification.permission === 'granted') {
            const n = new Notification(title, {body});
            n.onclick = function () {
                window.focus();
            };
        }
    };

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

    accept = transport => () => {
        transports.patch(transport._id, {state: 1})
            .then(this.edit(transport))
            .catch(e => notification.error(e.message));
    };

    editAllowed = transport => auth.isDispo || transport.userId === auth.user._id;

    openTransports = resource => this.list.filter(t => t.resourceId === resource._id && t.state < 3);

    get existNewTransports() {
        return this.list.some(t => t.state === 0);
    }
}
