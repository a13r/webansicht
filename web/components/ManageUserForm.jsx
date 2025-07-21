import React from "react";
import {inject, observer} from "mobx-react";
import restrictToRoles from "~/components/restrictToRoles";
import Form from 'react-bootstrap/Form';
import {Button, ButtonToolbar, FormGroup} from "react-bootstrap";
import {Select, TextInput} from "~/components/formControls";
import {Panel} from "~/components/Panel";

export default restrictToRoles(['admin'])(inject('manageUser', 'stations')(observer(({manageUser, stations}) =>
    <Panel title="Benutzer verwalten">
        <Form onSubmit={manageUser.form.onSubmit}>
            <FormGroup className="mb-3">
                <Select field={manageUser.form.$('_id')}>
                    <option value=''>(neuer Benutzer)</option>
                    {manageUser.userList.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </Select>
                <TextInput field={manageUser.form.$('username')}/>
                <TextInput field={manageUser.form.$('name')}/>
                {manageUser.form.$('dispo').value &&
                    <TextInput field={manageUser.form.$('initials')}/>}
                <TextInput field={manageUser.form.$('password')}/>
                <TextInput field={manageUser.form.$('passwordRepeat')}/>
                <Form.Check {...manageUser.form.$('admin').bind()}/>
                <Form.Check {...manageUser.form.$('dispo').bind()}/>
                <Form.Check {...manageUser.form.$('station').bind()}/>
                <Form.Check {...manageUser.form.$('transports').bind()}/>
                {manageUser.form.$('station').value &&
                    <Select field={manageUser.form.$('stationId')}>
                        <option value="">(keine)</option>
                        {stations.list.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </Select>}
            </FormGroup>
            <ButtonToolbar className="gap-2">
                <Button type="submit" variant="primary">speichern</Button>
                <Button variant="success" onClick={manageUser.createUser}>neu</Button>
            </ButtonToolbar>
        </Form>
    </Panel>)));
