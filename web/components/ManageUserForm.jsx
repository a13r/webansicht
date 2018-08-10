import React from "react";
import {inject, observer} from "mobx-react";
import restrictToRoles from "~/components/restrictToRoles";
import {Button, Checkbox, Panel} from "react-bootstrap";
import {Select, TextInput} from "~/components/formControls";

export default restrictToRoles(['admin'])(inject('auth', 'stations')(observer(({auth, stations}) =>
    <Panel header={<span>Benutzer verwalten</span>}>
        <form onSubmit={auth.manageUserForm.onSubmit}>
            <Select field={auth.manageUserForm.$('_id')}>
                <option>(neuer Benutzer)</option>
                {auth.userList.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
            <TextInput field={auth.manageUserForm.$('username')}/>
            <TextInput field={auth.manageUserForm.$('name')}/>
            {auth.manageUserForm.$('dispo').value &&
                <TextInput field={auth.manageUserForm.$('initials')}/>}
            <TextInput field={auth.manageUserForm.$('password')}/>
            <TextInput field={auth.manageUserForm.$('passwordRepeat')}/>
            <Checkbox {...auth.manageUserForm.$('admin').bind()}>Administrator</Checkbox>
            <Checkbox {...auth.manageUserForm.$('dispo').bind()}>Disponent</Checkbox>
            <Checkbox {...auth.manageUserForm.$('station').bind()}>SanHiSt</Checkbox>
            {auth.manageUserForm.$('station').value &&
            <Select field={auth.manageUserForm.$('stationId')}>
                <option value="">(keine)</option>
                {stations.list.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>}
            <div className="btn-toolbar">
                <Button type="submit" bsStyle="primary">speichern</Button>
                <Button onClick={auth.createUser}>neu</Button>
            </div>
        </form>
    </Panel>)));
