import {BaseForm} from "~/forms/baseForm";
import {action, observable} from "mobx";
import {transports} from "~/app";
import {notification} from "~/stores";
import moment from "moment";

export class TransportForm extends BaseForm {
    @observable
    isVisible;

    setup() {
        return {
            fields: {
                _id: {
                    label: 'ID',
                    type: 'hidden'
                },
                state: {
                    label: 'Status',
                    type: 'number'
                },
                requester: {
                    label: 'Anfordernde Stelle'
                },
                priority: {
                    label: 'Dringlichkeit',
                    type: 'number'
                },
                type: {
                    label: 'Transportart',
                    type: 'number'
                },
                hasCompany: {
                    label: 'Begleitperson',
                    type: 'checkbox'
                },
                diagnose: {
                    label: 'Verdachtsdiagnose'
                },
                destination: {
                    fields: {
                        station: {
                            label: 'Zielabteilung'
                        },
                        hospital: {
                            label: 'Zielkrankenhaus'
                        }
                    }
                },
                patient: {
                    fields: {
                        firstName: {label: 'Vorname'},
                        lastName: {label: 'Nachname'},
                        insuranceNumber: {label: 'SV/PLT-Nummer'}
                    }
                },
                resourceId: {
                    label: 'Ressource'
                }
            }
        }
    }

    hooks() {
        return {
            onSuccess(form) {
                const _id = form.$('_id').value;
                const values = form.values();
                values._id = values._id || undefined;
                values.resourceId = values.resourceId || undefined;
                if (!_id) {
                    transports.create(values)
                        .then(() => notification.success('Transportanforderung erstellt'))
                        .then(form.hide)
                        .catch(e => notification.error(e.message));
                } else {
                    transports.patch(_id, values)
                        .then(() => notification.success('Transportanforderung aktualisiert'))
                        .then(form.hide)
                        .catch(e => notification.error(e.message));
                }
            }
        }
    }

    @action
    hide = () => this.isVisible = false;
    @action
    show = () => this.isVisible = true;
}
