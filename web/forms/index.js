import stores from "~/stores";
import _ from "lodash";
import {DeleteDataForm} from "~/forms/deleteData";
import {SendMessageForm} from "~/forms/sendMessageForm";

const forms = {
    resourceEditorForm: stores.resources.form,
    resourceAdminForm: stores.resourceAdmin.form,
    logFilterForm: stores.log.form,
    loginForm: stores.auth.loginForm,
    changePasswordForm: stores.auth.changePasswordForm,
    manageUserForm: stores.manageUser.form,
    journalForm: stores.journal.form,
    deleteResourceForm: stores.resourceAdmin.deleteResourceForm,
    deleteDataForm: new DeleteDataForm(),
    transportForm: stores.transports.form,
    todoForm: stores.todos.form,
    sendMessageForm: new SendMessageForm()
};
export default forms;

export function clearForms() {
    _.values(forms).forEach(form => form.clear());
}
