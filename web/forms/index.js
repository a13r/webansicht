import stores from "~/stores";
import MobxReactFormDevTools from "mobx-react-form-devtools";
import _ from "lodash";
import {DeleteDataForm} from "~/forms/deleteData";

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
    transportForm: stores.transports.form
};
export default forms;

export function clearForms() {
    _.values(forms).forEach(form => form.clear());
}

if (process.env.NODE_ENV === 'development') {
    MobxReactFormDevTools.register(forms);
}
