import React from "react";
import {inject, observer} from "mobx-react";
import restrictToRoles from "~/components/restrictToRoles";
import {Button, Checkbox, Panel} from "react-bootstrap";
import {Select, TextInput} from "~/components/formControls";

export default restrictToRoles(['admin'])(inject('manageUser', 'stations')(observer(({manageUser, stations}) =>
    <Panel header={<span>Benutzer verwalten</span>}>
        <form onSubmit={manageUser.form.onSubmit}>
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
            <Checkbox {...manageUser.form.$('admin').bind()}>Administrator</Checkbox>
            <Checkbox {...manageUser.form.$('dispo').bind()}>Disponent</Checkbox>
            <Checkbox {...manageUser.form.$('station').bind()}>SanHiSt</Checkbox>
            {manageUser.form.$('station').value &&
            <Select field={manageUser.form.$('stationId')}>
                <option value="">(keine)</option>
                {stations.list.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>}
            <div className="btn-toolbar">
                <Button type="submit" bsStyle="primary">speichern</Button>
                <Button onClick={manageUser.createUser}>neu</Button>
            </div>
        </form>
    </Panel>)));
