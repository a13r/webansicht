import React from 'react';
import JournalList from "../components/JournalList";
import JournalEditor from "../components/JournalEditor";
import {Row, Col} from 'react-bootstrap';
import authenticate from '../components/authenticate';

export default authenticate(() =>
    <Row>
        <Col md={12}>
            <JournalList/>
        </Col>
        <Col md={6}>
            <JournalEditor/>
        </Col>
    </Row>);
