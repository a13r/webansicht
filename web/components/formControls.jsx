import React from "react";
import {Button, ControlLabel, FormControl, FormGroup, HelpBlock, InputGroup} from "react-bootstrap";
import {observer} from "mobx-react";

export const Select = observer(({field, children}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl componentClass="select" {...field.bind()} inputRef={i => field.input = i}>{children}</FormControl>
    </FormGroup>);

export const TextInput = observer(({field}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl {...field.bind()} inputRef={i => field.input = i}/>
        {!field.isValid && <HelpBlock>{field.error}</HelpBlock>}
    </FormGroup>);

export const HomeTextInput = observer(({field, onClick}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <InputGroup>
            <FormControl {...field.bind()} inputRef={i => field.input = i}/>
            <InputGroup.Button>
                <Button onClick={onClick}><i className="glyphicon glyphicon-home"/></Button>
            </InputGroup.Button>
        </InputGroup>
        {!field.isValid && <HelpBlock>{field.error}</HelpBlock>}
    </FormGroup>);
