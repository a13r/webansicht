import React from "react";
import {ProgressBar} from "react-bootstrap";

function styleForPercentage(now) {
    if (now > 90) {
        return "danger";
    }
    if (now > 70) {
        return "warning";
    }
    return "success";
}

export default ({now, ...props}) => <ProgressBar now={Math.min(now, 100)} bsStyle={styleForPercentage(now)} {...props}/>;
