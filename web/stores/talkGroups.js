import {action, observable} from 'mobx';
import {loginReaction} from "~/stores/index";
import {talkGroups} from "~/app";

export class TalkGroupStore {
    @observable
    list = [];

    constructor() {
        loginReaction(({auth}) => {
            if (auth.isDispo) {
                talkGroups.find().then(action(list => this.list = list));
            }
        });
    }
}
