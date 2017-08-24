import React from 'react';
import {FormGroup, Button} from 'react-bootstrap';
import {observer, inject} from 'mobx-react';
import {TextInput} from './formControls';
import restrictToRoles from './restrictToRoles';

export default restrictToRoles(['admin'])(inject('store')(observer(({store: {auth: {createUserForm: form}}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Neuer Benutzer</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={form.onSubmit}>
                <TextInput field={form.$('username')}/>
                <TextInput field={form.$('name')}/>
                <TextInput field={form.$('initials')}/>
                <TextInput field={form.$('password')}/>
                <TextInput field={form.$('passwordRepeat')}/>
                {form.error && <div className="alert alert-danger">{form.error}</div>}
                <FormGroup>
                    <div className="btn-toolbar">
                        <Button type="submit" bsStyle="primary" disabled={!form.isValid}>erstellen</Button>
                        <Button onClick={() => form.clear()}>abbrechen</Button>
                    </div>
                </FormGroup>
            </form>
        </div>
    </div>)));
