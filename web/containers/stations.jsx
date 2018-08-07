import React from "react";
import restrictToRoles from "~/components/restrictToRoles";
import {Col, Row} from "react-bootstrap";

export default restrictToRoles(['dispo', 'station'])(() =>
    <div>
        <Row>
            <Col md={12}>
                SanHiSt
            </Col>
        </Row>
    </div>
);
