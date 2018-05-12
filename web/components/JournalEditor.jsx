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

const AuditList = restrictToRoles(['admin'])(inject('store')(observer(({store: {journal}}) =>
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
                <td>{journal.form.$(log.field).label}</td>
                <td>{log.field === 'createdAt' ? moment(log.before).format('L LT') : log.before}</td>
                <td>{log.field === 'createdAt' ? moment(log.after).format('L LT') : log.after}</td>
                <td>{log.initials}</td>
            </tr>)}
        </tbody>
    </table> || null)));

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
            <AuditList/>
            <Modal.Footer>
                <Button onClick={journal.createEntry}>Neuer Eintrag</Button>
                <Button onClick={journal.closeEditor}>Abbrechen</Button>
                <Button type="submit" bsStyle="primary">Speichern</Button>
            </Modal.Footer>
        </form>
    </Modal>)));
