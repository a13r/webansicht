import React from "react";
import ResourceList from "../components/ResourceList";
import ResourceEditor from "../components/ResourceEditor";
import {CardBody, CardHeader, CardTitle, Col, Row} from "react-bootstrap";
import {inject, observer} from "mobx-react";
import authenticate from "../components/authenticate";
import StationLoad from "~/components/StationLoad";
import moment from "moment";
import Card from "react-bootstrap/Card";

export default authenticate(inject('auth', 'stations')(observer(({auth, stations}) =>
    <Row>
        <Col md={9}>
            <ResourceList/>
        </Col>
        <Col md={3}>
            {auth.isDispo && <ResourceEditor/>}
            {stations.list.map(s =>
                <Card key={s._id} className="mt-2">
                    <CardHeader>
                        <CardTitle className="d-inline">{s.name}</CardTitle>
                        <small className="float-end">seit {moment(s.updatedAt).format('HH:mm')}</small>
                    </CardHeader>
                    <CardBody>
                        <StationLoad now={s.loadPercentage} label={s.loadLabel} style={{marginBottom: 0}}/>
                    </CardBody>
                </Card>)}
        </Col>
    </Row>)));
