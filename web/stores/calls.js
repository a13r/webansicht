import {calls} from '~/app';
import {loginReaction} from "~/stores/index";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import moment from "moment";

export class CallStore {
    @observable
    list = [];

    constructor() {
        loginReaction(({auth}) => {
            if (auth.isDispo) {
                this.find();
                calls.on('created', this.onCreated);
                calls.on('removed', this.onRemoved);
            } else {
                calls.off('created', this.onCreated);
                calls.off('removed', this.onRemoved);
            }
        });
    }

    find() {
        calls.find({query: {$sort: {timestamp: -1}}}).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        this.list.unshift(entry);
    };

    @action
    onRemoved = ({_id}) => _.remove(this.list, {_id});

    @computed
    get lastIncoming() {
        const incoming = this.list.filter(e => e.direction === 'incoming');
        if (incoming.length > 0) {
            return incoming[0];
        }
    };

    @computed
    get lastIncomingText() {
        const last = this.lastIncoming;
        if (last) {
            let caller = `[${moment(last.timestamp).format('HH:mm:ss')}] `;
            if (last.resource) {
                caller += last.resource.type + ' ' + last.resource.callSign;
            } else {
                caller += last.issi;
            }
            return caller;
        }
    }
}
