import React from "react";
import {inject, observer} from "mobx-react";
import {Button, Checkbox, Col, Row} from "react-bootstrap";
import {TextInput} from "~/components/formControls";
import StationLoad from "~/components/StationLoad";
import {Panel} from "~/components/Panel";

const Station = inject('auth', 'stations')(observer(({auth, stations: store, station}) =>
    <Col lg={3} md={4}>
        <Panel title={station.name || 'Neue SanHiSt'} bsStyle={station.form.changed ? 'warning' : 'default'}>
            <StationLoad now={station.form.loadPercentage} label={station.form.loadLabel}/>
            <form onSubmit={store.submitNew(station)}>
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
                    <Button className="pull-right" onClick={station.reset}>abbrechen</Button>}
                    {station.isNew &&
                        <Button onClick={store.removeNew(station)} className="pull-right">abbrechen</Button>}
                </div>
                </fieldset>
            </form>
        </Panel>
    </Col>));

export default inject('stations')(observer(({stations}) =>
    <Row>
        {stations.list.map(s => <Station key={s._id || Math.random()} station={s}/>)}
    </Row>));
