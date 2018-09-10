import {action, computed, observable} from "mobx";
import {BaseForm} from "~/forms/baseForm";
import {log, resources, users, journal, stations} from "~/app";
import {notification} from "~/stores";
import {equalsConst} from "~/forms/validators";

export class DeleteDataForm extends BaseForm {
    @observable
    modalVisible = false;

    setup() {
        return {
            fields: {
                resources: { type: 'checkbox' },
                journal: { type: 'checkbox' },
                log: { type: 'checkbox' },
                stations: { type: 'checkbox' },
                users: { type: 'checkbox' },
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
                form.hide();
            }
        }
    }

    @action
    show = () => this.modalVisible = true;

    @action
    hide = () => {
        this.modalVisible = false;
        this.clear();
    };

    @computed
    get selectedItems() {
        const descriptions = [];
        if (this.values().resources) descriptions.push('Ressourcen');
        if (this.values().journal) descriptions.push('Einsatztagebuch');
        if (this.values().log) descriptions.push('Statusverlauf');
        if (this.values().stations) descriptions.push('SanHiSts');
        if (this.values().users) descriptions.push('Benutzer');
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
