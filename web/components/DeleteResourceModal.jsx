import React from "react";
import {inject, observer} from "mobx-react";
import restrictToRoles from "~/components/restrictToRoles";
import {Button, Modal} from "react-bootstrap";
import {TextInput} from "~/components/formControls";

export default restrictToRoles(['admin'])(inject('deleteResourceForm')(observer(({deleteResourceForm: form}) =>
    <Modal show={form.visible} onHide={form.hide}>
        <form onSubmit={form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>Ressource "{form.$('name').value}" löschen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextInput field={form.$('nameRepeat')} autoComplete="off"/>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={form.hide}>abbrechen</Button>
                <Button type="submit" bsStyle="danger"><i className="fa fa-trash"/> löschen</Button>
            </Modal.Footer>
        </form>
    </Modal>
)));
