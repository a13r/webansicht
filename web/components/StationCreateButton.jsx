import React from "react";
import {observer} from "mobx-react";
import {Button, Col, Row} from "react-bootstrap";
import restrictToRoles from "~/components/restrictToRoles";

export default restrictToRoles(['admin'])(observer(['stations'], ({stations}) =>
    <Row>
        <Col md={12}>
            <Button className="mb-16" onClick={stations.create}><i className="fa fa-plus-circle"/> Neue SanHiSt</Button>
        </Col>
    </Row>));
