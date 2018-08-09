import * as React from "react";
import authenticate from "../components/authenticate";
import ChangePasswordForm from "../components/ChangePasswordForm";
import {Col, Row} from "react-bootstrap";
import ManageUserForm from "~/components/ManageUserForm";

export default authenticate(() =>
    <Row>
        <Col md={3}>
            <ManageUserForm/>
        </Col>
        <Col md={3} mdOffset={6}>
            <ChangePasswordForm/>
        </Col>
    </Row>
);
