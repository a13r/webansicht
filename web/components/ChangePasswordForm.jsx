import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';
import {Panel} from "~/components/Panel";

export default inject('changePasswordForm')(observer(({changePasswordForm: form}) =>
    <Panel title="Passwort ändern">
        <form onSubmit={form.onSubmit}>
            <TextInput field={form.$('oldPassword')}/>
            <TextInput field={form.$('password')}/>
            <TextInput field={form.$('passwordRepeat')}/>
            <div className="btn-toolbar">
                <Button type="submit" bsStyle="primary" disabled={!form.isValid}>speichern</Button>
                <Button onClick={() => form.clear()}>abbrechen</Button>
            </div>
        </form>
    </Panel>));
