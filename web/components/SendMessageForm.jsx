import {Button, ControlLabel, FormControl, FormGroup, ToggleButton} from "react-bootstrap";
import React from "react";
import {observer} from "mobx-react";
import ToggleButtonGroup from "react-bootstrap/es/ToggleButtonGroup";

export const SendMessageForm = observer(({form}) => <form onSubmit={form.onSubmit}>
    <FormGroup>
        <ControlLabel>Nachricht senden</ControlLabel>
        <FormControl componentClass="textarea" {...form.$('message').bind()}/>
    </FormGroup>
    <div className="btn-toolbar">
        <Button type="submit" bsStyle="primary">Senden</Button>
        {form.hasCallout && <ToggleButtonGroup defaultValue={false} {...form.$('callout').bind()}>
            <ToggleButton value={false}>Nachricht</ToggleButton>
            <ToggleButton value={true}>Callout</ToggleButton>
        </ToggleButtonGroup>}
    </div>
</form>);
