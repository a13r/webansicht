import {BaseForm} from "~/forms/baseForm";
import {messages} from "~/app";
import {notification} from "~/stores";
import {required} from "~/forms/validators";
import {observable} from "mobx";

export class SendMessageForm extends BaseForm {
    @observable
    hasCallout = false;

    setup() {
        return {
            fields: {
                destination: {
                    label: 'ID',
                    type: 'hidden'
                },
                message: {
                    validators: [required()]
                },
                callout: {
                    type: 'radio',
                    default: false
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess(form) {
                const {destination, message, callout} = form.values();
                const data = {
                    destination, message
                };
                if (callout) {
                    data.callout = {severity: 1}
                }
                messages.create(data)
                    .then(() => form.$('message').clear())
                    .catch(e => notification.error(e.message, 'Fehler beim Senden der Nachricht'));
            }
        };
    }
}
