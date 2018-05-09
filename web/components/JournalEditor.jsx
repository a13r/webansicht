import React from "react";
import {Button, Modal} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import {inject, observer} from "mobx-react";
import {selectOptions} from "../stores/journal";
import authenticate from "./authenticate";

const SelectWithOptions = ({field, options}) =>
    <Select field={field}>
        {options.map(v => <option key={v}>{v}</option>)}
    </Select>;

export default authenticate(inject('store')(observer(({store: {journal}}) =>
    <Modal show={journal.editorVisible} onHide={journal.closeEditor}>
        <form onSubmit={journal.form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>ETB-Eintrag {journal.selectedEntryId ? 'bearbeiten' : 'erstellen'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextInput field={journal.form.$('createdAt')}/>
                <TextInput field={journal.form.$('text')}/>
                <TextInput field={journal.form.$('reporter')}/>
                <SelectWithOptions field={journal.form.$('reportedVia')}
                                   options={selectOptions.reportedVia}/>
                <SelectWithOptions field={journal.form.$('direction')}
                                   options={selectOptions.direction}/>
                <SelectWithOptions field={journal.form.$('priority')}
                                   options={selectOptions.priority}/>
                <SelectWithOptions field={journal.form.$('state')}
                                   options={selectOptions.state}/>
                <TextInput field={journal.form.$('comment')}/>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={journal.createEntry}>Neuer Eintrag</Button>
                <Button onClick={journal.closeEditor}>Abbrechen</Button>
                <Button type="submit" bsStyle="primary">Speichern</Button>
            </Modal.Footer>
        </form>
    </Modal>)));
