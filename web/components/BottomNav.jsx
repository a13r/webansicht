import React from 'react';
import {inject, observer} from 'mobx-react';
import restrictToRoles from "~/components/restrictToRoles";
import {Navbar} from "react-bootstrap";

export const BottomNav = restrictToRoles(['dispo'])(inject('calls', 'talkGroups')(observer(({calls, talkGroups}) =>
    <Navbar fixedBottom fluid inverse className="hidden-xs">
        {calls.lastIncomingTexts.map((l, i) =>
            <Navbar.Header key={i}>
                <Navbar.Text>{l.talkGroup} [{l.timestamp}]</Navbar.Text>
                <Navbar.Brand>{l.caller}</Navbar.Brand>
            </Navbar.Header>)}
    </Navbar>)));
