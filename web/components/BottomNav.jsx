import React from 'react';
import {inject, observer} from 'mobx-react';
import restrictToRoles from "~/components/restrictToRoles";
import {Container, Navbar} from "react-bootstrap";

export const BottomNav = restrictToRoles(['dispo'])(inject('calls', 'talkGroups')(observer(({calls, talkGroups}) =>
    <Navbar fixed="bottom" bg="dark" variant="dark">
        <Container fluid>
            {calls.lastIncomingTexts.map((l, i) =>
                <Navbar.Text key={i}>
                    <span>{l.talkGroup} [{l.timestamp}]</span>
                    <span className="ms-2">{l.caller}</span>
                </Navbar.Text>
            )}
        </Container>
    </Navbar>)));
