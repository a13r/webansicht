import React from "react";
import LogList from "../components/LogList";
import {Col, Row} from "react-bootstrap";
import LogFilter from "../components/LogFilter";
import restrictToRoles from "../components/restrictToRoles";

export default restrictToRoles(['dispo'])(() =>
    <Row>
        <Col md={9}>
            <LogList/>
        </Col>
        <Col md={3}>
            <LogFilter/>
        </Col>
    </Row>);
