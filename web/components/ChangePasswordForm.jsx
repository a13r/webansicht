import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, FormGroup} from 'react-bootstrap';
import {TextInput} from './formControls';

export default inject('store')(observer(({store: {auth}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Passwort ändern</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={auth.changePasswordForm.onSubmit}>
                <TextInput field={auth.changePasswordForm.$('oldPassword')}/>
                <TextInput field={auth.changePasswordForm.$('password')}/>
                <TextInput field={auth.changePasswordForm.$('passwordRepeat')}/>
                <FormGroup>
                    <Button type="submit">speichern</Button>
                </FormGroup>
                {auth.changePasswordForm.error &&
                <div className="alert alert-danger">{auth.changePasswordForm.error}</div>}
            </form>
        </div>
    </div>));
