import React from 'react';
import restrictToRoles from "~/components/restrictToRoles";
import {inject, observer} from 'mobx-react';
import {Alert, Button, Form} from "react-bootstrap";
import {Panel} from "~/components/Panel";

export default restrictToRoles(['admin'])(inject('auth', 'importExport')(observer(({auth, importExport: store}) =>
    <div>
        <Panel title="Export" className="mb-3">
            <div className="btn-toolbar">
                <form action="/export.tar" method="post">
                    <input type="hidden" name="accessToken" value={auth.token}/>
                    <Button type="submit"><i className="fa fa-database"/> Datenbank exportieren</Button>
                </form>
            </div>
        </Panel>
        <Panel title="Import">
            <Form>
                <Form.Group controlId="importFile">
                    <Form.Label>Datei (tar)</Form.Label>
                    <Form.Control type="file" onChange={store.setImportFile}/>
                </Form.Group>
                {!store.isValidFile &&
                    <Alert variant="danger">Datei ist keine tar-Datei</Alert>}
                <Button disabled={!store.importFile || !store.isValidFile} className="mt-3"
                        onClick={store.sendFile}><i className="fa fa-database"/> Datenbank importieren</Button>
            </Form>
        </Panel>
    </div>)));
