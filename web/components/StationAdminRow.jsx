import React from "react";
import {inject, observer} from "mobx-react";
import {Button, Col, Row} from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import restrictToRoles from "~/components/restrictToRoles";

export default restrictToRoles(['admin'])(inject('stations')(observer(({stations}) =>
    <Row className="mb-2">
        <Col md={12}>
            <Button onClick={stations.create}><i className="fa fa-plus-circle"/> hinzufügen</Button>
            <Form.Check id="showDeleted" onChange={e => stations.setShowDeleted(e)} checked={stations.showDeleted} className="float-end" label="ausgeblendete anzeigen"/>
        </Col>
    </Row>)));
