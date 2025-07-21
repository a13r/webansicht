import React from "react";
import Card from 'react-bootstrap/Card';

export const Panel = ({title, children, ...props}) =>
    <Card {...props}>
        <Card.Header>
            {title}
        </Card.Header>
        <Card.Body>
            {children}
        </Card.Body>
    </Card>;
