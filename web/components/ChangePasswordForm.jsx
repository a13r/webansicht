import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, ButtonToolbar} from 'react-bootstrap';
import {TextInput} from './formControls';
import {Panel} from "~/components/Panel";

export default inject('changePasswordForm')(observer(({changePasswordForm: form}) =>
    <Panel title="Passwort ändern">
        <form onSubmit={form.onSubmit}>
            <TextInput field={form.$('oldPassword')}/>
            <TextInput field={form.$('password')}/>
            <TextInput field={form.$('passwordRepeat')}/>
            <ButtonToolbar className="mt-3 gap-2">
                <Button type="submit" variant="primary" disabled={!form.isValid}>speichern</Button>
                <Button onClick={() => form.clear()} variant="outline-secondary">abbrechen</Button>
            </ButtonToolbar>
        </form>
    </Panel>));
