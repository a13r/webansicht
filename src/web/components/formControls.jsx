import React from "react";
import {ControlLabel, FormControl, FormGroup} from "react-bootstrap";
import {observer} from "mobx-react";

export const Select = observer(({field, children}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl componentClass="select" {...field.bind()}>{children}</FormControl>
    </FormGroup>);

export const TextInput = observer(({field}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl type="text" {...field.bind()}/>
    </FormGroup>);

