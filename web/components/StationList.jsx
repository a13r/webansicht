import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, Col, Panel, ProgressBar, Row} from "react-bootstrap";
import {TextInput} from "~/components/formControls";

const Station = observer(['stations'], ({stations: store, station}) =>
    <Col md={2}>
        <Panel header={station.name.value} bsStyle={station.form.changed ? 'warning' : 'default'}>
            <ProgressBar now={station.loadPercentage}
                         label={`${station.currentPatients.value}/${station.maxPatients.value}`}/>
            <TextInput field={station.name}/>
            <TextInput field={station.currentPatients}/>
            <TextInput field={station.maxPatients}/>
            <ButtonGroup>
                <Button onClick={() => station.form.submit()} bsStyle="primary" disabled={station.form.submitting}>Speichern</Button>
                {station.isNew && <Button onClick={() => store.removeNew(station)}>Abbrechen</Button>}
            </ButtonGroup>
        </Panel>
    </Col>);

export default observer(['stations'], ({stations}) =>
    <Row>
        {stations.list.map(s => <Station key={s._id} station={s}/>)}
    </Row>);
