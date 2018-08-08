import React from "react";
import {inject, observer} from "mobx-react";
import {Button, Checkbox, Col, Panel, ProgressBar, Row} from "react-bootstrap";
import {TextInput} from "~/components/formControls";

const Station = inject('auth', 'stations')(observer(({auth, stations: store, station}) =>
    <Col lg={2} md={4}>
        <Panel header={station.name.value} bsStyle={station.form.changed ? 'warning' : 'default'}>
            <ProgressBar now={station.loadPercentage}
                         label={`${station.currentPatients.value}/${station.maxPatients.value}`}/>
            <form onSubmit={e => store.submitNew(station, e)}>
                <Row>
                    <Col lg={6}>
                        <TextInput field={station.currentPatients} min={0}/>
                    </Col>
                    <Col lg={6}>
                        <TextInput field={station.maxPatients} min={0}/>
                    </Col>
                </Row>
                {auth.user.roles.includes('admin') && <div>
                    <TextInput field={station.name}/>
                    <Checkbox {...station.deleted.bind()}>ausgeblendet</Checkbox>
                    <TextInput field={station.ordering}/>
                </div>}
                <div className="btn-toolbar">
                    {station.form.changed &&
                        <Button type="submit" bsStyle="primary" disabled={station.form.submitting}>Speichern</Button>}
                    {station.isNew &&
                        <Button onClick={() => store.removeNew(station)} className="pull-right">Abbrechen</Button>}
                </div>
            </form>
        </Panel>
    </Col>));

export default observer(['stations'], ({stations}) =>
    <Row>
        {stations.list.map(s => <Station key={s._id} station={s}/>)}
    </Row>);
