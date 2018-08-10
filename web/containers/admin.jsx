import React from "react";
import restrictToRoles from '../components/restrictToRoles';
import {inject, observer} from "mobx-react";
import {TextInput} from "../components/formControls";
import {Button, Checkbox, Col, FormGroup, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import "../styles/admin.css";

export default restrictToRoles(['dispo'])(inject('resourceAdmin')(observer(({resourceAdmin}) =>
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
                        <th>Kennung</th>
                        <th>Typ</th>
                        <th>Kdt./Fahrer</th>
                        <th>Reihung</th>
                        <th>Heimatstandort</th>
                        <th>ausgeblendet</th>
                    </tr>
                    </thead>
                    <tbody>
                    {resourceAdmin.list.map(r =>
                        <tr onClick={() => resourceAdmin.selectResource(r._id)} key={r._id}
                            className={'resourceRow' + (resourceAdmin.selectedResourceId === r._id ? ' active' : '')}>
                            <td>{r.tetra}</td>
                            <td>{r.callSign}</td>
                            <td>{r.type}</td>
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
            <div className="panel panel-default">
                <div className="panel-heading">
                    <h2 className="panel-title">
                        {resourceAdmin.selectedResourceId ? 'Ressource bearbeiten' : 'Neue Ressource'}
                    </h2>
                </div>
                <div className="panel-body">
                    <form onSubmit={resourceAdmin.form.onSubmit}>
                        <TextInput field={resourceAdmin.form.$('callSign')}/>
                        <TextInput field={resourceAdmin.form.$('type')}/>
                        <TextInput field={resourceAdmin.form.$('tetra')}/>
                        <TextInput field={resourceAdmin.form.$('contact')}/>
                        <TextInput field={resourceAdmin.form.$('ordering')}/>
                        <TextInput field={resourceAdmin.form.$('home')}/>
                        <Checkbox {...resourceAdmin.form.$('hidden').bind()}>ausblenden</Checkbox>
                        <FormGroup>
                            <div className="btn-toolbar">
                                <Button bsStyle="primary" type="submit" disabled={!resourceAdmin.form.isValid}>
                                    <i className="fa fa-save"/> Speichern
                                </Button>
                                <Button onClick={() => resourceAdmin.showEditor(false)}> Abbrechen</Button>
                            </div>
                        </FormGroup>
                    </form>
                </div>
            </div>
        </Col>}
    </Row>)));
