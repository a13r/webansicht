import {TextInput} from "~/components/formControls";
import {Button} from "react-bootstrap";
import React from "react";
import {observer} from "mobx-react";

export const SendMessageForm = observer(({form}) => <form onSubmit={form.onSubmit}>
    <TextInput field={form.$('message')}/>
    <Button type="submit" bsStyle="primary">Senden</Button>
</form>);
