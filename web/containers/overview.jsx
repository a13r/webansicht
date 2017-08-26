import React from "react";
import ResourceList from "../components/ResourceList";
import ResourceEditor from "../components/ResourceEditor";
import {Col, Row} from "react-bootstrap";
import {inject, observer} from "mobx-react";
import authenticate from "../components/authenticate";

export default authenticate(inject('store')(observer(({store: {auth}}) =>
    <Row>
        <Col md={auth.isDispo ? 9 : 12}>
            <ResourceList/>
        </Col>
        {auth.isDispo &&
        <Col md={3}>
            <ResourceEditor/>
        </Col>}
    </Row>)));
