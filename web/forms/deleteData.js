import {action, computed, makeObservable, observable} from "mobx";
import {BaseForm} from "~/forms/baseForm";
import {log, resources, users, journal, stations, transports, calls, todos, messages, positions} from "~/app";
import {notification} from "~/stores";
import {equalsConst} from "~/forms/validators";

export class DeleteDataForm extends BaseForm {
    modalVisible = false;

    constructor() {
        super();
        makeObservable(this, {
            modalVisible: observable,
            show: action,
            hide: action,
            selectedItems: computed
        });
    }

    setup() {
        return {
            fields: {
                resources: { type: 'checkbox', label: 'Ressourcen' },
                journal: { type: 'checkbox', label: 'Einsatztagebuch' },
                log: { type: 'checkbox', label: 'Statusverlauf' },
                stations: { type: 'checkbox', label: 'SanHiSts' },
                users: { type: 'checkbox', label: 'Benutzer' },
                transports: { type: 'checkbox', label: 'Transporte' },
                todos: {type: 'checkbox', label: 'Todos'},
                calls: {type: 'checkbox', label: 'Funksprüche'},
                messages: {type: 'checkbox', label: 'Nachrichten'},
                positions: {type: 'checkbox', label: 'Positionen'},
                confirm: {
                    label: 'Bitte "ja, wirklich" eingeben:',
                    validators: [equalsConst('ja, wirklich')]
                }
            }
        };
    }

    hooks() {
        return {
            onSubmit(form) {
                if (form.values().resources) {
                    removeAll(resources, 'Ressourcen gelöscht');
                }
                if (form.values().journal) {
                    removeAll(journal, 'Einsatztagebuch geleert');
                }
                if (form.values().log) {
                    removeAll(log, 'Statusverlauf gelöscht');
                }
                if (form.values().stations) {
                    removeAll(stations, 'SanHiSts gelöscht');
                }
                if (form.values().users) {
                    users.find().then(users => users.filter(u => !(u.roles.includes('admin') || u.roles.includes('dispo'))))
                        .then(list => removeList(users, list, 'Benutzer gelöscht'));
                }
                if (form.values().transports) {
                    removeAll(transports, 'Transporte gelöscht');
                }
                if (form.values().todos) {
                    removeAll(todos, 'Todos gelöscht');
                }
                if (form.values().calls) {
                    removeAll(calls, 'Funksprüche gelöscht');
                }
                if (form.values().messages) {
                    removeAll(messages, 'Nachrichten gelöscht');
                }
                if (form.values().positions) {
                    positions.find().then(positions => positions.filter(p => !!p.issi))
                        .then(list => removeList(positions, list, 'Positionen gelöscht'));
                }
                form.hide();
            }
        }
    }

    show = () => this.modalVisible = true;

    hide = () => {
        this.modalVisible = false;
        this.clear();
    };

    get selectedItems() {
        const descriptions = [];
        if (this.values().resources) descriptions.push('Ressourcen');
        if (this.values().journal) descriptions.push('Einsatztagebuch');
        if (this.values().log) descriptions.push('Statusverlauf');
        if (this.values().stations) descriptions.push('SanHiSts');
        if (this.values().users) descriptions.push('Benutzer');
        if (this.values().transports) descriptions.push('Transporte');
        if (this.values().todos) descriptions.push('Todos');
        if (this.values().calls) descriptions.push('Funksprüche');
        if (this.values().messages) descriptions.push('Nachrichten');
        if (this.values().positions) descriptions.push('Positionen');
        return descriptions;
    }
}

function removeAll(service, successMessage) {
    return service.find().then(list => removeList(service, list, successMessage));
}

function removeList(service, list, successMessage) {
    return Promise.all(list.map(({_id}) => service.remove(_id)))
        .then(() => notification.success(successMessage));
}
