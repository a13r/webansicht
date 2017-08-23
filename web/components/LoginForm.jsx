import React from 'react';
import {inject, observer} from 'mobx-react';
import {Alert, Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';

export default inject('store')(observer(({store: {auth: {form}}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Anmelden</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={form.onSubmit}>
                <TextInput field={form.$('username')}/>
                <TextInput field={form.$('password')}/>
                <FormGroup>
                    <Button type="submit">Anmelden</Button>
                </FormGroup>
                {form.hasError && <Alert bsStyle="danger">{form.error}</Alert>}
            </form>
        </div>
    </div>
));
