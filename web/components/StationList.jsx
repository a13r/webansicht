import React from "react";
import {inject, observer} from "mobx-react";
import {Button, ButtonToolbar, CardBody, CardHeader, CardTitle, Col, Form, Row} from "react-bootstrap";
import {TextInput} from "~/components/formControls";
import StationLoad from "~/components/StationLoad";
import Card from "react-bootstrap/Card";

const Station = inject('auth', 'stations')(observer(({auth, stations: store, station}) =>
    <Col lg={3} md={4}>
        <Card className={station.isNew || station.form.changed ? 'bg-warning-subtle mb-3' : 'mb-3'}>
            <CardHeader>
                {station.name || station.form.$('name').value || 'Neue SanHiSt'}
            </CardHeader>
            <CardBody>

                <StationLoad now={station.form.loadPercentage} label={station.form.loadLabel}/>
                <Form onSubmit={store.submitNew(station)}>
                    <fieldset disabled={!station.canWrite}>
                        <Row>
                            <Col lg={6}>
                                <TextInput field={station.form.$('currentPatients')} min={0} autoFocus/>
                            </Col>
                            <Col lg={6}>
                                <TextInput field={station.form.$('maxPatients')} min={0}/>
                            </Col>
                        </Row>
                        {auth.user.roles.includes('admin') && <div>
                            <TextInput field={station.form.$('name')}/>
                            <Form.Check className="mb-2" {...station.form.$('deleted').bind()}/>
                            <TextInput field={station.form.$('ordering')}/>
                        </div>}
                        <ButtonToolbar className="gap-2 mt-3">
                            <Button type="submit" variant="primary"
                                    disabled={station.form.submitting}>speichern</Button>
                            <Button onClick={store.remove(station)} variant="outline-secondary">abbrechen</Button>
                        </ButtonToolbar>
                    </fieldset>
                </Form>
            </CardBody>
        </Card>
    </Col>));

export default inject('stations')(observer(({stations}) =>
    <Row>
        {stations.list.map(s => <Station key={s._id || Math.random()} station={s}/>)}
    </Row>));
