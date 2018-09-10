import React from "react";
import {Panel as BsPanel} from "react-bootstrap";

export const Panel = ({title, children, ...props}) =>
    <BsPanel header={<h2 className="panel-title">{title}</h2>} {...props}>{children}</BsPanel>;
