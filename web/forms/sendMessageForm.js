import {BaseForm} from "~/forms/baseForm";
import {messages} from "~/app";
import {notification} from "~/stores";
import {required} from "~/forms/validators";

export class SendMessageForm extends BaseForm {

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
                    data.callout = {severity: 7}
                }
                messages.create(data)
                    .then(() => form.$('message').clear())
                    .catch(e => notification.error(e.message, 'Fehler beim Senden der Nachricht'));
            }
        };
    }
}
