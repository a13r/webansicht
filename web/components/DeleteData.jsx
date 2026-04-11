import React from 'react';
import restrictToRoles from "~/components/restrictToRoles";
import {inject, observer} from 'mobx-react';
import Form from 'react-bootstrap/Form';
import {Button, Modal} from "react-bootstrap";
import {TextInput} from "~/components/formControls";
import {Panel} from "~/components/Panel";

export default restrictToRoles(['admin'])(inject('deleteDataForm')(observer(({deleteDataForm: form}) =>
    <div>
        <Panel title="Daten löschen">
            <div className="mb-2">Zu löschende Daten:</div>
            <Form.Check label="Ressourcen" {...form.$('resources').bind()} />
            <Form.Check label="Einsatztagebuch" {...form.$('journal').bind()}/>
            <Form.Check label="Statusverlauf" {...form.$('log').bind()}/>
            <Form.Check label="SanHiSts" {...form.$('stations').bind()}/>
            <Form.Check label="Benutzer (ausgen. Admins und Dispos)" {...form.$('users').bind()}/>
            <Form.Check label="Transporte" {...form.$('transports').bind()}/>
            <Form.Check label="Todos" {...form.$('todos').bind()}/>
            <Form.Check label="Funksprüche" {...form.$('calls').bind()}/>
            <Form.Check label="Nachrichten" {...form.$('messages').bind()}/>
            <Form.Check label="Positionen" {...form.$('positions').bind()}/>
            <Button onClick={form.show} disabled={form.selectedItems.length === 0} className="mt-3">Löschen</Button>
        </Panel>
        <Modal show={form.modalVisible} onHide={form.hide}>
            <form onSubmit={form.onSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Daten löschen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {form.selectedItems.length > 0 &&
                        <div>
                            <p>Folgende Daten werden gelöscht:</p>
                            <ul>
                                {form.selectedItems.map(d => <li key={d}>{d}</li>)}
                            </ul>
                        </div>}
                    <TextInput field={form.$('confirm')} autoComplete="off"/>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={form.hide}>Abbrechen</Button>
                    <Button variant="danger" type="submit" disabled={!form.isValid}>
                        <i className="fa fa-trash fa-fw"/> Löschen
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    </div>)));
