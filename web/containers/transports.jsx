import authenticate from "~/components/authenticate";
import {inject, observer} from "mobx-react";
import React from "react";
import moment from "moment";
import {Button, Checkbox, FormGroup, Modal} from "react-bootstrap";
import {Select, TextInput} from "~/components/formControls";

const PatientSection = observer(({form}) =>
    <fieldset>
        <h4>Patient</h4>
        <TextInput field={form.$('firstName')}/>
        <TextInput field={form.$('lastName')}/>
        <TextInput field={form.$('insuranceNumber')}/>
    </fieldset>);

const states = ['angefordert', 'in Durchführung', 'abgeschlossen', 'storniert'];
const priorities = ['normal', 'dringend', 'sofort'];
const prioritiesLong = ['normal (stabiler Patient)', 'dringend (möglicherweise lebensbedrohend)', 'sofort (lebensbedrohend)'];
const types = ['liegend', 'sitzend', 'gehfähig'];

const TransportForm = inject('auth', 'transportForm', 'resources')(observer(({auth, transportForm: form, resources}) =>
        <Modal show={form.isVisible} onHide={form.hide}>
            <form onSubmit={form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>Anforderung Patientenabtransport</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {auth.isDispo && [
                    <Select field={form.$('state')} key={1}>
                        {states.map((s, i) => <option value={i} key={i}>{s}</option>)}
                    </Select>,
                    <TextInput field={form.$('requester')} key={2}/>]}
                <Select field={form.$('priority')}>
                    <option value={-1}>(bitte wählen)</option>
                    {prioritiesLong.map((p, i) => <option value={i} key={i}>{p}</option>)}
                </Select>
                <Select field={form.$('type')}>
                    <option value={-1}>(bitte wählen)</option>
                    {types.map((t, i) => <option value={i} key={i}>{t}</option>)}
                </Select>
                <Checkbox {...form.$('hasCompany').bind()}>+ Begleitperson</Checkbox>
                <TextInput field={form.$('diagnose')}/>
                <TextInput field={form.$('destination.station')}/>
                {auth.isDispo && [
                    <TextInput field={form.$('destination.hospital')} key={1}/>,
                    <Select field={form.$('resourceId')} key={2}>
                        <option>(keine gewählt)</option>
                        {resources.list.map(r => <option key={r._id} value={r._id}>{r.type} {r.callSign}</option>)}
                    </Select>
                ]}
                <PatientSection form={form.$('patient')}/>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={form.hide}>Abbrechen</Button>
                <Button type="submit" bsStyle="primary">Speichern</Button>
            </Modal.Footer>
            </form>
        </Modal>
    ));

const stateClass = {
    0: 'bg-danger',
    1: 'bg-warning',
    2: 'bg-success',
    3: 'bg-success'
};

export default authenticate(inject('transports')(observer(({transports}) =>
    <div>
        <FormGroup>
            <Button onClick={transports.createNew}><i className="fa fa-plus fa-fw"/> Abtransport anfordern</Button>
        </FormGroup>
        <div className="panel panel-default">
            <table className="table table-striped table-bordered">
                <thead>
                <tr>
                    <th style={{width: '10em'}}>Zeitpunkt</th>
                    <th style={{width: '10em'}}>Status</th>
                    <th>Anfordernde Stelle</th>
                    <th>Dringlichkeit</th>
                    <th>Transportart</th>
                    <th>Verdachtsdiagnose</th>
                    <th>Ziel</th>
                    <th>Ressource</th>
                </tr>
                </thead>
                <tbody>
                {transports.list.map(t =>
                    <tr key={t._id} style={{cursor: transports.editAllowed(t) ? 'pointer' : 'not-allowed'}} onClick={transports.edit(t)}>
                        <td>{moment(t.createdAt).format('L LT')}</td>
                        <td className={stateClass[t.state]}>{states[t.state]}</td>
                        <td>{t.requester}</td>
                        <td>{priorities[t.priority]}</td>
                        <td>{types[t.type]} {t.hasCompany && '+ Bgl.'}</td>
                        <td>{t.diagnose}</td>
                        <td>{t.destination.hospital} {t.destination.station}</td>
                        <td>{t.resource && <span>{t.resource.type} {t.resource.callSign}</span>}</td>
                    </tr>)}
                </tbody>
            </table>
            <div className="panel-footer">
                Gesamtanzahl: {transports.list.length}
            </div>
            <TransportForm/>
        </div>
    </div>)));
