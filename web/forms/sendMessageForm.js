import {BaseForm} from "~/forms/baseForm";
import {messages} from "~/app";
import {notification} from "~/stores";

export class SendMessageForm extends BaseForm {

    setup() {
        return {
            fields: {
                destination: {
                    label: 'ID',
                    type: 'hidden'
                },
                message: {
                    label: 'Nachricht'
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess(form) {
                const {destination, message} = form.values();
                messages.create({destination, message})
                    .then(() => form.$('message').clear())
                    .catch(e => notification.error(e.message, 'Fehler beim Senden der Nachricht'));
            }
        };
    }
}
