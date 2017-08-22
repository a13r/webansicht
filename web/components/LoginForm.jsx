import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button} from 'react-bootstrap';
import {TextInput} from './formControls';

export default inject('store')(observer(({store: {auth}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Anmelden</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={auth.form.onSubmit}>
                <TextInput field={auth.form.$('username')}/>
                <TextInput field={auth.form.$('password')}/>
                <Button type="submit">Anmelden</Button>
            </form>
        </div>
    </div>
));
