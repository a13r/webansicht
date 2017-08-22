import React from "react";
import LogList from "../components/LogList";
import {Col, Row} from "react-bootstrap";
import LogFilter from "../components/LogFilter";
import authenticate from '../components/authenticate';

export default authenticate(() =>
    <Row>
        <Col md={9}>
            <LogList/>
        </Col>
        <Col md={3}>
            <LogFilter/>
        </Col>
    </Row>);
