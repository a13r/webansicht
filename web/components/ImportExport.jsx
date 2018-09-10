import React from 'react';
import restrictToRoles from "~/components/restrictToRoles";
import {inject, observer} from 'mobx-react';
import {Alert, Button, ControlLabel, FormControl, FormGroup} from "react-bootstrap";
import {Panel} from "~/components/Panel";

export default restrictToRoles(['admin'])(inject('auth', 'importExport')(observer(({auth, importExport: store}) =>
    <div>
        <Panel title="Export">
            <div className="btn-toolbar">
                <form action="/export.tar" method="post">
                    <input type="hidden" name="accessToken" value={auth.token}/>
                    <Button type="submit"><i className="fa fa-database"/> Datenbank exportieren</Button>
                </form>
            </div>
        </Panel>
        <Panel title="Import">
            <FormGroup>
                <ControlLabel>Datei (tar)</ControlLabel>
                <FormControl type="file" onChange={store.setImportFile}/>
            </FormGroup>
            {!store.isValidFile &&
                <Alert bsStyle="danger">Datei ist keine tar-Datei</Alert>}
            <Button disabled={!store.importFile || !store.isValidFile}
                    onClick={store.sendFile}><i className="fa fa-database"/> Datenbank importieren</Button>
        </Panel>
    </div>)));
