export function minLength(length) {
    return ({field}) => {
        return [field.value.length >= length, `${field.label} muss mind. ${length} Zeichen lang sein`];
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
