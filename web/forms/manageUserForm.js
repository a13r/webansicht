import {BaseForm} from "~/forms/baseForm";
import {minLengthIfNew, passwordEqualTo, required, requiredIf} from "~/forms/validators";
import {manageUser, notification} from "~/stores";
import {users} from "~/app";

export class ManageUserForm extends BaseForm {
    setup() {
        return {
            fields: {
                _id: {
                    label: 'Benutzer'
                },
                admin: {
                    label: 'Administrator',
                    type: 'checkbox'
                },
                dispo: {
                    label: 'Disponent',
                    type: 'checkbox',
                    related: ['initials']
                },
                station: {
                    label: 'SanHiSt',
                    type: 'checkbox'
                },
                username: {
                    label: 'Benutzername',
                    validators: [required()]
                },
                name: {
                    label: 'Name',
                    validators: [required()]
                },
                initials: {
                    label: 'Kürzel',
                    validators: [requiredIf('dispo')]
                },
                stationId: {
                    label: 'Eigene SanHiSt'
                },
                password: {
                    label: 'Neues Passwort',
                    type: 'password',
                    validators: [minLengthIfNew(8)],
                    related: ['passwordRepeat']
                },
                passwordRepeat: {
                    label: 'Neues Passwort (wdh.)',
                    type: 'password',
                    validators: [passwordEqualTo('password')]
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess: form => {
                const {_id, admin, dispo, station, username, name, initials, password, stationId} = form.values();
                const roles = [];
                if (admin) roles.push('admin');
                if (dispo) roles.push('dispo');
                if (station) roles.push('station');

                const data = {roles, username, name, initials, stationId};
                if (!stationId) {
                    data.stationId = null;
                }
                if (password.length) {
                    data.password = password;
                }
                if (!initials) {
                    data.initials = username;
                }
                if (_id) {
                    return users.patch(_id, data)
                        .then(user => notification.success(`${user.name} wurde geändert`))
                        .then(() => form.$('_id').input.focus())
                        .catch(error => notification.error(error.message, 'Fehler beim Ändern des Benutzers'));
                } else {
                    return users.create(data)
                        .then(user => {
                            manageUser.selectUser(user._id);
                            notification.success(`${user.name} wurde erfolgreich erstellt.`);
                        })
                        .then(() => form.$('_id').input.focus())
                        .catch(error => notification.error(error.message, 'Fehler beim Erstellen des Benutzers'));
                }
            }
        };
    }
}
