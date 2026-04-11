import {Form} from "mobx-react-form";
import vjf from "mobx-react-form/lib/validators/VJF";

export class BaseForm extends Form {
    plugins() {
        return {
            vjf: vjf()
        };
    }

    options() {
        return {
            validateOnChange: true,
            validateOnBlur: true
        };
    }
}
