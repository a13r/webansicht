import React from "react";
import AuditList from "../components/AuditList";
import {Col, Row} from "react-bootstrap";
import AuditFilter from "../components/AuditFilter";

export default () =>
    <Row>
        <Col md={9}>
            <AuditList/>
        </Col>
        <Col md={3}>
            <AuditFilter/>
        </Col>
    </Row>
