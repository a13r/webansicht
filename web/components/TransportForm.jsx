import React from "react";
import {inject, observer} from "mobx-react";
import {Select, TextInput} from "~/components/formControls";
import {Button, Checkbox, Modal} from "react-bootstrap";
import {states, types, prioritiesLong} from "~/shared/strings";

const PatientSection = observer(({form}) =>
    <fieldset>
        <h4>Patient</h4>
        <TextInput field={form.$('firstName')}/>
        <TextInput field={form.$('lastName')}/>
        <TextInput field={form.$('insuranceNumber')}/>
    </fieldset>);


export const TransportForm = inject('auth', 'transportForm', 'resources')(observer(({auth, transportForm: form, resources}) =>
    <Modal show={form.isVisible} onHide={form.hide}>
        <form onSubmit={form.onSubmit}>
            <Modal.Header closeButton>
                <Modal.Title>Patientenabtransport</Modal.Title>
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
