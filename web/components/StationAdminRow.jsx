import React from "react";
import {inject, observer} from "mobx-react";
import {Button, Checkbox, Col, Row} from "react-bootstrap";
import restrictToRoles from "~/components/restrictToRoles";

export default restrictToRoles(['admin'])(inject('stations')(observer(({stations}) =>
    <Row>
        <Col md={12}>
            <Button className="mb-16" onClick={stations.create}><i className="fa fa-plus-circle"/> hinzufügen</Button>
            <Checkbox onChange={e => stations.setShowDeleted(e)} className="pull-right">ausgeblendete anzeigen</Checkbox>
        </Col>
    </Row>)));
