import React from 'react';
import restrictToRoles from "~/components/restrictToRoles";
import {inject, observer} from 'mobx-react';
import {Button, Checkbox, Modal} from "react-bootstrap";
import {TextInput} from "~/components/formControls";
import {Panel} from "~/components/Panel";

export default restrictToRoles(['admin'])(inject('deleteDataForm')(observer(({deleteDataForm: form}) =>
    <div>
        <Panel title="Daten löschen">
            Zu löschende Daten:
            <Checkbox {...form.$('resources').bind()}>Ressourcen</Checkbox>
            <Checkbox {...form.$('journal').bind()}>Einsatztagebuch</Checkbox>
            <Checkbox {...form.$('log').bind()}>Statusverlauf</Checkbox>
            <Checkbox {...form.$('stations').bind()}>SanHiSts</Checkbox>
            <Checkbox {...form.$('users').bind()}>Benutzer (ausgen. Admins und Dispos)</Checkbox>
            <Button onClick={form.show} disabled={form.selectedItems.length === 0}>Löschen</Button>
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
                    <Button bsStyle="danger" type="submit" disabled={!form.isValid}>
                        <i className="fa fa-trash fa-fw"/> Löschen
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    </div>)));
