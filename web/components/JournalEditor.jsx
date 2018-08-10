import React from "react";
import {Button, Modal} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import {inject, observer} from "mobx-react";
import {selectOptions} from "../stores/journal";
import authenticate from "./authenticate";
import moment from "moment";
import restrictToRoles from "~/components/restrictToRoles";

const SelectWithOptions = ({field, options}) =>
    <Select field={field}>
        {options.map(v => <option key={v}>{v}</option>)}
    </Select>;

const AuditList = restrictToRoles(['admin'])(inject('journal', 'journalForm')(observer(({journal, journalForm: form}) =>
    journal.selectedEntry && journal.selectedEntry.auditLog && journal.selectedEntry.auditLog.length &&
    <table className="table table-condensed table-bordered">
        <thead>
        <tr>
            <th>Zeitpunkt</th>
            <th>Feld</th>
            <th>alt</th>
            <th>neu</th>
            <th>Kürzel</th>
        </tr>
        </thead>
        <tbody>
        {journal.selectedEntry.auditLog.map(log =>
            <tr key={log.changedAt}>
                <td>{moment(log.changedAt).format('L LT')}</td>
                <td>{form.$(log.field).label}</td>
                <td>{log.field === 'createdAt' ? moment(log.before).format('L LT') : log.before}</td>
                <td>{log.field === 'createdAt' ? moment(log.after).format('L LT') : log.after}</td>
                <td>{log.initials}</td>
            </tr>)}
        </tbody>
    </table> || null)));

export default authenticate(inject('journal', 'journalForm')(observer(({journal, journalForm: form}) =>
    <Modal show={journal.editorVisible} onHide={journal.closeEditor}>
        <form onSubmit={form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>ETB-Eintrag {journal.selectedEntryId ? 'bearbeiten' : 'erstellen'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TextInput field={form.$('createdAt')}/>
                <TextInput field={form.$('text')}/>
                <TextInput field={form.$('reporter')}/>
                <SelectWithOptions field={form.$('reportedVia')}
                                   options={selectOptions.reportedVia}/>
                <SelectWithOptions field={form.$('direction')}
                                   options={selectOptions.direction}/>
                <SelectWithOptions field={form.$('priority')}
                                   options={selectOptions.priority}/>
                <SelectWithOptions field={form.$('state')}
                                   options={selectOptions.state}/>
                <TextInput field={form.$('comment')}/>
            </Modal.Body>
            <AuditList/>
            <Modal.Footer>
                <Button onClick={journal.createEntry}>Neuer Eintrag</Button>
                <Button onClick={journal.closeEditor}>Abbrechen</Button>
                <Button type="submit" bsStyle="primary">Speichern</Button>
            </Modal.Footer>
        </form>
    </Modal>)));
