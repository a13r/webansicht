import React from "react";
import JournalList from "../components/JournalList";
import {Col, Row} from "react-bootstrap";
import ExportButton from "../components/ExportButton";
import restrictToRoles from "../components/restrictToRoles";

export default restrictToRoles(['dispo'])(() =>
    <div>
        <Row>
            <Col md={12}>
                <JournalList/>
            </Col>
        </Row>
        <Row>
            <Col md={12}>
                <ExportButton path="/export.xlsx"/>
            </Col>
        </Row>
    </div>);
