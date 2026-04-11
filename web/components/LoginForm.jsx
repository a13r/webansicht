import React from 'react';
import {inject, observer} from 'mobx-react';
import {Alert, Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';
import {Panel} from "~/components/Panel";

export default inject('auth', 'loginForm')(observer(({auth, loginForm: form}) =>
    <Panel title="Anmelden">
        <form onSubmit={form.onSubmit}>
            <TextInput field={form.$('username')} autoFocus/>
            <TextInput field={form.$('password')}/>
            {form.error && <Alert variant="danger">{form.error}</Alert>}
            <Button type="submit" variant="primary">Anmelden</Button>
        </form>
        {auth.ssoAvailable &&
            <Button variant="outline-secondary" className="mt-2" onClick={() => auth.loginSSO()}>
                Mit SSO anmelden
            </Button>}
    </Panel>));
