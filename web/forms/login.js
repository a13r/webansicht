import {BaseForm} from "~/forms/baseForm";
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
                auth.login(form.values())
                    .catch(e => {
                        form.$('username').input.focus();
                        form.reset();
                        form.invalidate(e.message);
                    });
            }
        }
    }
}
