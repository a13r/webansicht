import * as React from "react";
import authenticate from "../components/authenticate";
import ChangePasswordForm from "../components/ChangePasswordForm";
import {Col, Row} from "react-bootstrap";
import ManageUserForm from "~/components/ManageUserForm";
import ImportExport from "~/components/ImportExport";
import DeleteData from "~/components/DeleteData";

export default authenticate(() =>
    <Row>
        <Col md={3}>
            <ManageUserForm/>
        </Col>
        <Col md={3}>
            <ImportExport/>
        </Col>
        <Col md={3}>
            <DeleteData/>
        </Col>
        <Col md={3}>
            <ChangePasswordForm/>
        </Col>
    </Row>
);
