import React from "react";
import {Button, Form, InputGroup} from "react-bootstrap";
import {observer} from "mobx-react";

export const Select = observer(({field, children}) =>
    <>
        <Form.Label htmlFor={field.id} column="1">{field.label}</Form.Label>
        <Form.Select className="mb-2" {...field.bind()} ref={i => field.input = i}>{children}</Form.Select>
        {!field.isValid && <Form.Control.Feedback>{field.error}</Form.Control.Feedback>}
    </>);

export const TextInput = observer(({field, ...props}) =>
    <Form.Group>
        <Form.Label htmlFor={field.id}>{field.label}</Form.Label>
        <Form.Control isInvalid={field.blurred && !field.isValid} className="mb-2" type="text" {...field.bind()} ref={i => field.input = i} {...props}/>
        {field.blurred && !field.isValid && <Form.Text className="text-muted">{field.error}</Form.Text>}
    </Form.Group>);

export const PositionTextInput = observer(({field, onClickHome, onClickSwap}) =>
    <>
        <Form.Label htmlFor={field.id}>{field.label}</Form.Label>
        <InputGroup className="mb-2">
            <Form.Control type="text" {...field.bind()} ref={i => field.input = i}/>
            <Button onClick={onClickSwap} variant="outline-secondary"><i className="fa fa-retweet"/></Button>
            <Button onClick={onClickHome} variant="outline-secondary"><i className="fa fa-home"/></Button>
        </InputGroup>
        {!field.isValid && <Form.Control.Feedback>{field.error}</Form.Control.Feedback>}
    </>);
