import React from 'react';
import {inject, observer} from 'mobx-react';
import {Alert, Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';
import {Panel} from "~/components/Panel";

export default inject('auth', 'loginForm')(observer(({auth, loginForm: form}) =>
    <Panel title="Anmelden">
        <form onSubmit={form.onSubmit}>
            <TextInput field={form.$('username')}/>
            <TextInput field={form.$('password')}/>
            {form.error && <Alert bsStyle="danger">{form.error}</Alert>}
            <Button type="submit" bsStyle="primary">Anmelden</Button>
        </form>
    </Panel>));
