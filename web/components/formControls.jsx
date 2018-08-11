import React from "react";
import {Button, ControlLabel, FormControl, FormGroup, HelpBlock, InputGroup} from "react-bootstrap";
import {observer} from "mobx-react";

export const Select = observer(({field, children}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl componentClass="select" {...field.bind()} inputRef={i => field.input = i}>{children}</FormControl>
    </FormGroup>);

export const TextInput = observer(({field, ...props}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <FormControl {...field.bind()} inputRef={i => field.input = i} {...props}/>
        {!field.isValid && <HelpBlock>{field.error}</HelpBlock>}
    </FormGroup>);

export const PositionTextInput = observer(({field, onClickHome, onClickSwap}) =>
    <FormGroup>
        <ControlLabel>{field.label}</ControlLabel>
        <InputGroup>
            <FormControl {...field.bind()} inputRef={i => field.input = i}/>
            <InputGroup.Button>
                <Button onClick={onClickSwap}><i className="fa fa-retweet"/></Button>
                <Button onClick={onClickHome}><i className="glyphicon glyphicon-home"/></Button>
            </InputGroup.Button>
        </InputGroup>
        {!field.isValid && <HelpBlock>{field.error}</HelpBlock>}
    </FormGroup>);
