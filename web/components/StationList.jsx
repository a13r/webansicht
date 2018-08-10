import React from "react";
import {inject, observer} from "mobx-react";
import {Button, Checkbox, Col, Panel, Row} from "react-bootstrap";
import {TextInput} from "~/components/formControls";
import StationLoad from "~/components/StationLoad";

const Station = inject('auth', 'stations')(observer(({auth, stations: store, station}) =>
    <Col lg={2} md={4}>
        <Panel header={station.name || 'Neue SanHiSt'} bsStyle={station.form.changed ? 'warning' : 'default'}>
            <StationLoad now={station.form.loadPercentage} label={station.form.loadLabel}/>
            <form onSubmit={e => store.submitNew(station, e)}>
                <fieldset disabled={!station.canWrite}>
                <Row>
                    <Col lg={6}>
                        <TextInput field={station.form.$('currentPatients')} min={0}/>
                    </Col>
                    <Col lg={6}>
                        <TextInput field={station.form.$('maxPatients')} min={0}/>
                    </Col>
                </Row>
                {auth.user.roles.includes('admin') && <div>
                    <TextInput field={station.form.$('name')}/>
                    <Checkbox {...station.form.$('deleted').bind()}>ausgeblendet</Checkbox>
                    <TextInput field={station.form.$('ordering')}/>
                </div>}
                <div className="btn-toolbar">
                    {station.form.changed &&
                        <Button type="submit" bsStyle="primary" disabled={station.form.submitting}>speichern</Button>}
                    {station.form.changed && !station.isNew &&
                    <Button className="pull-right" onClick={() => station.reset()}>abbrechen</Button>}
                    {station.isNew &&
                        <Button onClick={() => store.removeNew(station)} className="pull-right">abbrechen</Button>}
                </div>
                </fieldset>
            </form>
        </Panel>
    </Col>));

export default observer(['stations'], ({stations}) =>
    <Row>
        {stations.list.map(s => <Station key={s._id} station={s}/>)}
    </Row>);
