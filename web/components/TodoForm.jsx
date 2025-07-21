import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, ButtonGroup, ButtonToolbar, Modal} from "react-bootstrap";
import {TextInput} from "~/components/formControls";

export const TodoForm = inject('todoForm')(observer(({todoForm: form}) =>
    <Modal show={form.isVisible} onHide={form.hide}>
        <form onSubmit={form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>Todo {form.values()._id ? 'bearbeiten' : 'erstellen'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextInput field={form.$('description')}/>
                <TextInput field={form.$('dueDate')}/>
                <ButtonGroup className="mt-3">
                    <Button variant="outline-secondary" onClick={form.addMinutes(-30)}>–0:30</Button>
                    <Button variant="outline-secondary" onClick={form.addMinutes(-15)}>–0:15</Button>
                    <Button variant="outline-primary" onClick={form.setNow}>jetzt</Button>
                    <Button variant="outline-secondary" onClick={form.trimMinutes}>:00</Button>
                    <Button variant="outline-secondary" onClick={form.addMinutes(15)}>+0:15</Button>
                    <Button variant="outline-secondary" onClick={form.addMinutes(30)}>+0:30</Button>
                </ButtonGroup>
            </Modal.Body>
            <Modal.Footer>
                {form.values()._id && <Button onClick={form.remove} variant="danger">Löschen</Button>}
                <Button onClick={form.hide}>Abbrechen</Button>
                <Button type="submit" variant="primary">Speichern</Button>
            </Modal.Footer>
        </form>
    </Modal>));
