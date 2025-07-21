import {Button, ButtonToolbar} from "react-bootstrap";
import React from "react";
import Form from 'react-bootstrap/Form';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import {observer} from "mobx-react";

export const SendMessageForm = observer(({form}) =>
    <Form onSubmit={form.onSubmit} className="mt-3">
        <Form.Label htmlFor={form.$('message').id}>Nachricht senden</Form.Label>
        <Form.Control as="textarea" className="mb-2" rows={3} {...form.$('message').bind()}/>
        <ButtonToolbar className="gap-2">
            <Button type="submit" variant="primary">Senden</Button>
            {form.hasCallout && <ToggleButtonGroup defaultValue={false} {...form.$('callout').bind()}>
                <ToggleButton id="msg-type-message" value={false} variant="outline-secondary">Nachricht</ToggleButton>
                <ToggleButton id="msg-type-callout" value={true} variant="outline-secondary">Callout</ToggleButton>
            </ToggleButtonGroup>}
        </ButtonToolbar>
    </Form>);
