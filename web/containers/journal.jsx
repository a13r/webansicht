import React from "react";
import JournalList from "../components/JournalList";
import {Col, Row} from "react-bootstrap";
import authenticate from "../components/authenticate";
import ExportButton from "../components/ExportButton";

export default authenticate(() =>
    <div>
        <Row>
            <Col md={12}>
                <JournalList/>
            </Col>
        </Row>
        <Row>
            <Col md={12}>
                <ExportButton/>
            </Col>
        </Row>
    </div>);
