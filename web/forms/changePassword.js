import {BaseForm} from "~/forms/baseForm";
import {minLength, passwordEqualTo} from "~/forms/validators";
import {notification} from "~/stores";
import {service} from "~/app";
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
                this.changePassword(auth.user.username, form.$('oldPassword').value, form.$('password').value)
                    .then(() => notification.success('Das Passwort wurde geändert'))
                    .then(() => form.clear())
                    .catch(error => {
                        notification.error(error.message, 'Das Passwort wurde nicht geändert');
                        form.$('oldPassword').clear();
                    });
            }
        };
    }

    changePassword(username, oldPassword, password) {
        return service('auth-management/change-password').create({
            user: {username},
            oldPassword,
            password
        });
    }
}
