import stores from "~/stores";
import MobxReactFormDevTools from "mobx-react-form-devtools";
import _ from "lodash";

const forms = {
    resourceEditorForm: stores.resources.form,
    resourceAdminForm: stores.resourceAdmin.form,
    logFilterForm: stores.log.form,
    loginForm: stores.auth.loginForm,
    changePasswordForm: stores.auth.changePasswordForm,
    manageUserForm: stores.manageUser.form,
    journalForm: stores.journal.form
};
export default forms;

export function clearForms() {
    _.values(forms).forEach(form => form.clear());
}

if (process.env.NODE_ENV === 'development') {
    MobxReactFormDevTools.register(forms);
}
