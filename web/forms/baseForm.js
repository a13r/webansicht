import {Form} from "mobx-react-form";
import validator from "validator";

export class BaseForm extends Form {
    plugins() {
        return {
            dvr: validator
        };
    }

    options() {
        return {
            validateOnChange: true,
            validateOnBlur: false
        };
    }
}
