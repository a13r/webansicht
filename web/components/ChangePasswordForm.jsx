import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';

export default inject('store')(observer(({store: {auth: {changePasswordForm: form}}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Passwort ändern</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={form.onSubmit}>
                <TextInput field={form.$('oldPassword')}/>
                <TextInput field={form.$('password')}/>
                <TextInput field={form.$('passwordRepeat')}/>
                <FormGroup>
                    <div className="btn-toolbar">
                        <Button type="submit" bsStyle="primary" disabled={!form.isValid}>speichern</Button>
                        <Button onClick={() => form.clear()}>abbrechen</Button>
                    </div>
                </FormGroup>
                {form.error && <div className="alert alert-danger">{form.error}</div>}
            </form>
        </div>
    </div>));
