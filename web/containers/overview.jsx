import React from "react";
import ResourceList from "../components/ResourceList";
import ResourceEditor from "../components/ResourceEditor";
import {Col, Panel, Row} from "react-bootstrap";
import {inject, observer} from "mobx-react";
import authenticate from "../components/authenticate";
import StationLoad from "~/components/StationLoad";

export default authenticate(inject('store', 'stations')(observer(({store: {auth}, stations}) =>
    <Row>
        <Col md={9}>
            <ResourceList/>
        </Col>
        <Col md={3}>
            {auth.isDispo && <ResourceEditor/>}
            {stations.list.map(s =>
                <Panel key={s._id} header={s.name}>
                    <StationLoad now={s.loadPercentage} label={s.loadLabel} style={{marginBottom: 0}}/>
                </Panel>)}
        </Col>
    </Row>)));
