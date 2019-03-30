import React from "react";
import restrictToRoles from '../components/restrictToRoles';
import {inject, observer} from "mobx-react";
import {TextInput} from "../components/formControls";
import {Button, Checkbox, Col, FormGroup, Row} from "react-bootstrap";
import "../styles/admin.css";
import DeleteResourceModal from "~/components/DeleteResourceModal";
import {Panel} from "~/components/Panel";
import {Select} from "~/components/formControls";

const DeleteButton = restrictToRoles(['admin'])(inject('resourceAdmin')(({resourceAdmin}) =>
    <Button bsStyle="danger" onClick={resourceAdmin.showDeleteModal}>
        <i className="fa fa-trash"/> Löschen
    </Button>));

export default restrictToRoles(['dispo'])(inject('resourceAdmin', 'talkGroups')(observer(({resourceAdmin, talkGroups}) =>
    <Row>
        <Col md={9}>
            <FormGroup>
                <Button onClick={resourceAdmin.createResource}>
                    <i className="fa fa-plus-circle"/> Neue Ressource
                </Button>
            </FormGroup>
            <div className="panel panel-default">
                <table className="table table-condensed table-hover">
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
                    </tr>
                    </thead>
                    <tbody>
                    {resourceAdmin.list.map(r =>
                        <tr onClick={() => resourceAdmin.selectPosition(r._id)} key={r._id}
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
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </Col>
        {resourceAdmin.editorVisible &&
        <Col md={3}>
            <Panel title={resourceAdmin.selectedResourceId ? 'Ressource bearbeiten' : 'Neue Ressource'}>
                <form onSubmit={resourceAdmin.form.onSubmit}>
                    <TextInput field={resourceAdmin.form.$('callSign')}/>
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
                    <Checkbox {...resourceAdmin.form.$('hidden').bind()}>ausblenden</Checkbox>
                    <div className="btn-toolbar">
                        <Button bsStyle="primary" type="submit" disabled={!resourceAdmin.form.isValid}>
                            <i className="fa fa-save"/> Speichern
                        </Button>
                        {resourceAdmin.selectedResourceId && <DeleteButton/>}
                        <Button onClick={() => resourceAdmin.showEditor(false)}> Abbrechen</Button>
                    </div>
                </form>
            </Panel>
        </Col>}
        <DeleteResourceModal/>
    </Row>)));
