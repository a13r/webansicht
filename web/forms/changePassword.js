import {BaseForm} from "~/forms/baseForm";
import {minLength, passwordEqualTo} from "~/forms/validators";
import {notification} from "~/stores";
import {changePassword} from "~/app";
import {auth} from "~/stores";

export class ChangePasswordForm extends BaseForm {
    setup() {
        return {
            fields: {
                oldPassword: {
                    label: 'Altes Passwort',
                    type: 'password'
                },
                password: {
                    label: 'Neues Passwort',
                    type: 'password',
                    validators: [minLength(8)],
                    related: ['passwordRepeat']
                },
                passwordRepeat: {
                    label: 'Neues Passwort (wiederholen)',
                    type: 'password',
                    validators: [passwordEqualTo('password')]
                }
            }
        };
    }

    hooks() {
        return {
            onSubmit(form) {
                changePassword(auth.user.username, form.$('oldPassword').value, form.$('password').value)
                    .then(() => notification.success('Das Passwort wurde geändert'))
                    .then(() => form.clear())
                    .catch(error => {
                        notification.error(error.message, 'Das Passwort wurde nicht geändert');
                        form.$('oldPassword').clear();
                        form.$('oldPassword').input.focus();
                    });
            }
        };
    }
}
