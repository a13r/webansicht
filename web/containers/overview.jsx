import React from "react";
import ResourceList from "../components/ResourceList";
import ResourceEditor from "../components/ResourceEditor";
import {Col, Panel, Row} from "react-bootstrap";
import {inject, observer} from "mobx-react";
import authenticate from "../components/authenticate";
import StationLoad from "~/components/StationLoad";
import moment from "moment";

export default authenticate(inject('auth', 'stations')(observer(({auth, stations}) =>
    <Row>
        <Col md={9}>
            <ResourceList/>
        </Col>
        <Col md={3}>
            {auth.isDispo && <ResourceEditor/>}
            {stations.list.map(s =>
                <Panel key={s._id} header={<span>{s.name}<span className="pull-right"><small>seit {moment(s.updatedAt).format('HH:mm')}</small></span></span>}>
                    <StationLoad now={s.loadPercentage} label={s.loadLabel} style={{marginBottom: 0}}/>
                </Panel>)}
        </Col>
    </Row>)));
