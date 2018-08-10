import {BaseForm} from "~/forms/baseForm";
import {login} from "~/app";
import {auth} from "~/stores";

export class LoginForm extends BaseForm {
    setup() {
        return {
            fields: {
                username: {
                    label: 'Benutzername'
                },
                password: {
                    label: 'Passwort',
                    type: 'password'
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess(form) {
                login(form.values())
                    .then(response => auth.processToken(response.accessToken))
                    .catch(e => {
                        form.$('username').input.focus();
                        form.reset();
                        form.invalidate(e.message);
                    });
            }
        }
    }
}
