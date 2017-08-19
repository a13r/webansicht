import React from "react";
import {inject, observer} from "mobx-react";
import {TextInput} from "../components/formControls";
import {Button, ListGroup, ListGroupItem, FormGroup} from "react-bootstrap";

export default inject('store')(observer(({store: {resourceAdmin}}) =>
    <div className="row">
        <div className="col-md-3">
            <div className="panel panel-default">
                <ListGroup>
                    {resourceAdmin.list.map(r =>
                        <ListGroupItem onClick={() => resourceAdmin.selectResource(r._id)}
                                       key={r._id} active={resourceAdmin.selectedResource._id === r._id}>
                            {r.callSign} ({r.type})
                        </ListGroupItem>)}
                </ListGroup>
            </div>
        </div>
        <div className="col-md-3">
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
                        <div className="btn-toolbar">
                            <Button bsStyle="primary" type="submit">
                                <i className="glyphicon glyphicon-save"/> Speichern
                            </Button>
                            <Button bsStyle="danger" onClick={resourceAdmin.remove}>
                                <i className="glyphicon glyphicon-trash"/> Löschen
                            </Button>
                            <Button onClick={resourceAdmin.createResource}>
                                Abbrechen
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>));
