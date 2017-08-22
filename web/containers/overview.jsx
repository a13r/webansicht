import React from 'react';
import ResourceList from "../components/ResourceList";
import ResourceEditor from "../components/ResourceEditor";
import {Row, Col} from 'react-bootstrap';
import authenticate from '../components/authenticate';

export default authenticate(() =>
    <Row>
        <Col md={9}>
            <ResourceList/>
        </Col>
        <Col md={3}>
            <ResourceEditor/>
        </Col>
    </Row>);
