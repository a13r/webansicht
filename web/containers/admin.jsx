import React from "react";
import authenticate from '../components/authenticate';
import {inject, observer} from "mobx-react";
import {TextInput} from "../components/formControls";
import {Button, Checkbox, Col, FormGroup, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import "../styles/admin.css";

export default authenticate(inject('store')(observer(({store: {resourceAdmin}}) =>
    <Row>
        <Col md={3}>
            <FormGroup>
                <Button onClick={resourceAdmin.createResource}>
                    <i className="glyphicon glyphicon-plus"/> Neue Ressource
                </Button>
            </FormGroup>
            <div className="panel panel-default">
                <ListGroup>
                    {resourceAdmin.list.map(r =>
                        <ListGroupItem onClick={() => resourceAdmin.selectResource(r._id)}
                                       key={r._id} active={resourceAdmin.selectedResourceId === r._id}>
                            {r.callSign} ({r.type})
                            {r.hidden && <i className="glyphicon glyphicon-eye-close pull-right"/>}
                        </ListGroupItem>)}
                </ListGroup>
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
                        <TextInput field={resourceAdmin.form.$('ordering')}/>
                        <Checkbox {...resourceAdmin.form.$('hidden').bind()}>ausblenden</Checkbox>
                        {!resourceAdmin.form.isValid && <div className="alert alert-danger">
                            Es müssen alle Felder ausgefüllt werden
                        </div>}
                        <FormGroup>
                            <div className="btn-toolbar">
                                <Button bsStyle="primary" type="submit" disabled={!resourceAdmin.form.isValid}>
                                    <i className="glyphicon glyphicon-save"/> Speichern
                                </Button>
                                <Button onClick={() => resourceAdmin.showEditor(false)}> abbrechen</Button>
                            </div>
                        </FormGroup>
                    </form>
                </div>
            </div>
        </Col>}
    </Row>)));
