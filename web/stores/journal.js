import {action, observable, computed, reaction} from 'mobx';
import {journal} from '../app';
import {Form} from 'mobx-react-form';
import _ from 'lodash';
import {auth, loginReaction, notification} from '../stores';
import Mousetrap from 'mousetrap';

export default class JournalStore {
    @observable
    list = [];
    @observable
    query = {
        $sort: {
            createdAt: -1
        }
    };
    form;
    @observable
    editorVisible = false;

    constructor() {
        this.form = new Form({fields}, {onSubmit: this});
        journal.on('created', action(this.onCreated));
        journal.on('updated', action(this.onUpdated));
        journal.on('patched', action(this.onUpdated));
        loginReaction(() => {
            this.find();
            Mousetrap.bind('ctrl+n', (e) => {
                if (_.isFunction(e.preventDefault)) {
                    e.preventDefault();
                }
                this.createEntry();
                return false;
            });
        }, () => Mousetrap.unbind('ctrl+n'));
    }

    find() {
        journal.find({query: this.query})
            .then(action(list => this.list = list));
    }

    onCreated = entry => {
        if (this.sortOrder === 1) {
            this.list.push(entry);
        } else {
            this.list.unshift(entry);
        }
    };

    onUpdated = entry => {
        const existing = _.find(this.list, {_id: entry._id});
        if (existing) {
            _.extend(existing, entry);
            if (this.selectedEntryId === entry._id) {
                this.form.update(entry);
            }
        } else {
            this.find();
        }
    };

    @computed
    get sortOrder() {
        return this.query.$sort.createdAt;
    }

    @computed
    get selectedEntryId() {
        return this.form.$('_id').value;
    }

    @action
    createEntry = () => {
        this.form.reset();
        this.editorVisible = true;
        setTimeout(() => this.form.$('text').input.focus(), 100);
    };

    @action
    closeEditor = () => {
        this.editorVisible = false;
        this.form.reset();
    };

    @action
    selectEntry = id => {
        const entry = _.find(this.list, {_id: id});
        if (entry) {
            this.form.update(entry);
            this.editorVisible = true;
            setTimeout(() => this.form.$('text').input.focus(), 100);
        }
    };

    @action
    toggleSortOrder() {
        this.query.$sort.createdAt = this.query.$sort.createdAt === 1 ? -1 : 1;
        this.find();
    }

    onSuccess = form => {
        const id = form.$('_id').value;
        if (id) {
            journal.patch(id, form.values())
                .then(() => notification.success('Protokolleintrag gespeichert'))
                .then(this.closeEditor);
        } else {
            const entry = form.values();
            _.unset(entry, '_id');
            journal.create(entry)
                .then(() => notification.success('Protokolleintrag erstellt'))
                .then(this.closeEditor);
        }
    };
}

export const selectOptions = {
    reportedVia: [
        'persönlich',
        'Funk',
        'Telefon',
        'E-Mail',
        'schriftlich',
        'Sonstiges',
        'Besprechung'
    ],
    direction: ['Eingang', 'Ausgang'],
    priority: ['normal', 'hoch', 'niedrig'],
    state: ['offen', 'bearb.', 'erledigt']
};

const fields = {
    _id: {
        label: 'ID'
    },
    text: {
        label: 'Eintrag'
    },
    reporter: {
        label: 'Melder'
    },
    reportedVia: {
        label: 'Meldeweg',
        value: selectOptions.reportedVia[0],
        //default: selectOptions.reportedVia[0]
    },
    direction: {
        label: 'Eingang/Ausgang',
        value: selectOptions.direction[0],
        //default: selectOptions.direction[0]
    },
    priority: {
        label: 'Priorität',
        value: selectOptions.priority[0],
        //default: selectOptions.priority[0]
    },
    state: {
        label: 'Status',
        value: selectOptions.state[0],
        //default: selectOptions.state[0]
    },
    comment: {
        label: 'Erledigungsvermerk'
    }
};