import moment from "moment";

export function minLength(length) {
    return ({field}) => {
        return [field.value.length >= length, `${field.label} muss mind. ${length} Zeichen lang sein`];
    }
}

export function minLengthIfNew(length) {
    return ({field, form}) => {
        return [field.value.length >= length || form.$('_id').value, `${field.label} muss mind. ${length} Zeichen lang sein`]
    }
}

export function isEqualTo(target) {
    return ({field, form}) => {
        const equal = (form.$(target).value === field.value);
        return [equal, `${form.$(target).label} stimmt nicht überein`];
    }
}

export function passwordEqualTo(target) {
    return ({field, form}) => {
        const passwordsEqual = (form.$(target).value === field.value);
        return [passwordsEqual, `Die Passwörter stimmen nicht überein`];
    };
}

export function required() {
    return ({field}) => {
        return [field.value.toString().length, `${field.label} ist erforderlich`];
    }
}

export function requiredIf(otherField) {
    return ({field, form}) => {
        return [field.value.length > 0 || !form.$(otherField).value, `${field.label} muss bei Disponenten gesetzt sein`];
    }
}

export function date(format) {
    return ({field}) => {
        return [moment(field.value, format).isValid(), `Datum und Uhrzeit erforderlich`];
    }
}
