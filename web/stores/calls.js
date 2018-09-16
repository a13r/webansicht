import {calls} from '~/app';
import {talkGroups} from '~/stores';
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
        calls.find({
            query: {
                direction: 'incoming',
                $sort: {timestamp: -1},
                $limit: 10
            }
        }).then(action(t => this.list = t));
    }

    @action
    onCreated = entry => {
        if (entry.direction === 'incoming') {
            this.list.unshift(entry);
        }
    };

    @action
    onRemoved = ({_id}) => _.remove(this.list, {_id});

    @computed
    get lastIncoming() {
        if (this.list.length > 0) {
            return this.list[0];
        }
    };

    @computed
    get lastIncomings() {
        return talkGroups.list.map(tg => {
            const incomings = this.list.filter(e => e.gssi === tg.gssi);
            return incomings.length > 0 ? _.assign({}, incomings[0], {talkGroup: tg}) : null;
        }).filter(e => e !== null);
    }

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

    @computed
    get lastIncomingTexts() {
        return this.lastIncomings.map(last => {
            let timestamp = moment(last.timestamp).format('HH:mm:ss');
            let caller;
            if (last.resource) {
                caller = last.resource.type + ' ' + last.resource.callSign;
            } else {
                caller = last.issi;
            }
            return {talkGroup: last.talkGroup.name, caller, timestamp};
        });
    }
}
