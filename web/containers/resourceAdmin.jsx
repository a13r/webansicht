import React from "react";
import restrictToRoles from '../components/restrictToRoles';
import {inject, observer} from "mobx-react";
import {TextInput} from "~/components/formControls";
import {Button, Form, Col, FormGroup, Row, ButtonToolbar} from "react-bootstrap";
import "../styles/admin.css";
import DeleteResourceModal from "~/components/DeleteResourceModal";
import {Panel} from "~/components/Panel";
import {Select} from "~/components/formControls";
import Card from "react-bootstrap/Card";

const DeleteButton = restrictToRoles(['admin'])(inject('resourceAdmin')(({resourceAdmin}) =>
    <Button variant="outline-danger" onClick={resourceAdmin.showDeleteModal}>
        <i className="fa fa-trash"/> Löschen
    </Button>));

export default restrictToRoles(['dispo'])(inject('resourceAdmin', 'talkGroups')(observer(({resourceAdmin, talkGroups}) =>
    <Row>
        <Col md={9}>
            <FormGroup className="mb-2">
                <Button onClick={resourceAdmin.createResource}>
                    <i className="fa fa-plus-circle"/> Neue Ressource
                </Button>
            </FormGroup>
            <Card>
                <table className="table table-condensed table-hover mb-0">
                    <thead>
                    <tr>
                        <th>TETRA</th>
                        <th>GSSI</th>
                        <th>Fahrzeug</th>
                        <th>Typ</th>
                        <th>Kennung</th>
                        <th>Kdt./Fahrer</th>
                        <th>Reihung</th>
                        <th>Heimatstandort</th>
                        <th>ausgeblendet</th>
                        <th>Callout</th>
                        <th>auf Karte</th>
                    </tr>
                    </thead>
                    <tbody>
                    {resourceAdmin.list.map(r =>
                        <tr onClick={() => resourceAdmin.selectResource(r._id)} key={r._id}
                            className={'resourceRow' + (resourceAdmin.selectedResourceId === r._id ? ' active' : '')}>
                            <td>{r.tetra}</td>
                            <td>{r.gssi}</td>
                            <td>{r.vehicle}</td>
                            <td>{r.type}</td>
                            <td>{r.callSign}</td>
                            <td>{r.contact}</td>
                            <td>{r.ordering}</td>
                            <td>{r.home}</td>
                            <td>{r.hidden && <i className="fa fa-eye-slash"/>}</td>
                            <td>{r.hasCallout && <i className="fa fa-bullhorn"/>}</td>
                            <td>{r.showOnMap && <i className="fa fa-map"/>}</td>
                        </tr>)}
                    </tbody>
                </table>
            </Card>
        </Col>
        {resourceAdmin.editorVisible &&
        <Col md={3}>
            <Panel title={resourceAdmin.selectedResourceId ? 'Ressource bearbeiten' : 'Neue Ressource'}>
                <form onSubmit={resourceAdmin.form.onSubmit}>
                    <TextInput field={resourceAdmin.form.$('callSign')} autoFocus/>
                    <TextInput field={resourceAdmin.form.$('type')}/>
                    <TextInput field={resourceAdmin.form.$('tetra')}/>
                    <Select field={resourceAdmin.form.$('gssi')}>
                        <option value="">(wählen)</option>
                        {talkGroups.list.map(g => <option key={g.gssi} value={g.gssi}>{g.name}</option>)}
                    </Select>
                    <TextInput field={resourceAdmin.form.$('vehicle')}/>
                    <TextInput field={resourceAdmin.form.$('contact')}/>
                    <TextInput field={resourceAdmin.form.$('ordering')}/>
                    <TextInput field={resourceAdmin.form.$('home')}/>
                    <Form.Check className="mb-2" {...resourceAdmin.form.$('hidden').bind()}/>
                    <Form.Check className="mb-2" {...resourceAdmin.form.$('hasCallout').bind()}/>
                    <Form.Check className="mb-2" {...resourceAdmin.form.$('showOnMap').bind()}/>
                    <ButtonToolbar className="gap-2">
                        <Button variant="success" type="submit" disabled={!resourceAdmin.form.isValid}>
                            <i className="fa fa-save"/> Speichern
                        </Button>
                        {resourceAdmin.selectedResourceId && <DeleteButton/>}
                        <Button variant="outline-secondary" onClick={() => resourceAdmin.showEditor(false)}> Abbrechen</Button>
                    </ButtonToolbar>
                </form>
            </Panel>
        </Col>}
        <DeleteResourceModal/>
    </Row>)));
