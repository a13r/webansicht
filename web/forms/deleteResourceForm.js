import {BaseForm} from "~/forms/baseForm";
import {resources} from "~/app";
import {action, observable} from "mobx";
import {isEqualTo} from "~/forms/validators";
import {notification, resourceAdmin} from "~/stores";

export class DeleteResourceForm extends BaseForm {
    resource;
    @observable
    visible = false;

    setup() {
        return {
            fields: {
                name: {
                    label: 'Kennung',
                    related: ['nameRepeat']
                },
                nameRepeat: {
                    label: 'Kennung zur Bestätigung wiederholen',
                    validators: [isEqualTo('name')]
                }
            }
        };
    }

    hooks() {
        return {
            onSuccess(form) {
                return resources.remove(form.resource._id)
                    .then(resource => notification.success(`${resource.callSign} wurde gelöscht`))
                    .then(form.hide)
                    .then(() => resourceAdmin.showEditor(false))
                    .catch(error => notification.error(error.message, 'Ressource konnte nicht gelöscht werden'));
            }
        }
    }

    @action
    show = resource => {
        this.clear();
        this.resource = resource;
        this.$('name').set(resource.callSign);
        this.visible = true;
    };

    @action
    hide = () => this.visible = false;
}
