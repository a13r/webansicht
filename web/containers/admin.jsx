import React from "react";
import {inject, observer} from "mobx-react";
import {TextInput} from "../components/formControls";
import {Button, Col, ListGroup, ListGroupItem, Row, FormGroup, Checkbox} from "react-bootstrap";
import '../styles/admin.css';

export default inject('store')(observer(({store: {resourceAdmin}}) =>
    <Row>
        <Col md={3}>
            <div className="panel panel-default">
                <ListGroup>
                    {resourceAdmin.list.map(r =>
                        <ListGroupItem onClick={() => resourceAdmin.selectResource(r._id)}
                                       key={r._id} active={resourceAdmin.selectedResource._id === r._id}>
                            {r.callSign} ({r.type})
                            {r.hidden && <i className="glyphicon glyphicon-eye-close pull-right"/>}
                        </ListGroupItem>)}
                </ListGroup>
            </div>
        </Col>
        <Col md={3}>
            <div className="panel panel-default">
                <div className="panel-heading">
                    <h2 className="panel-title">
                        {resourceAdmin.selectedResource._id ? 'Ressource bearbeiten' : 'Neue Ressource'}
                    </h2>
                </div>
                <div className="panel-body">
                    <form onSubmit={resourceAdmin.form.onSubmit}>
                        <TextInput field={resourceAdmin.form.$('callSign')}/>
                        <TextInput field={resourceAdmin.form.$('type')}/>
                        <TextInput field={resourceAdmin.form.$('contact')}/>
                        <Checkbox {...resourceAdmin.form.$('hidden').bind()}>ausblenden</Checkbox>
                        <FormGroup>
                            <div className="btn-toolbar">
                                <Button bsStyle="primary" type="submit" disabled={!resourceAdmin.form.isValid}>
                                    <i className="glyphicon glyphicon-save"/> Speichern
                                </Button>
                                <Button onClick={resourceAdmin.createResource}>
                                    Abbrechen
                                </Button>
                            </div>
                        </FormGroup>
                        {!resourceAdmin.form.isValid && <div className="alert alert-danger">
                            <b>*</b> Kennung und Typ dürfen nicht leer sein
                        </div>}
                    </form>
                </div>
            </div>
        </Col>
    </Row>));
