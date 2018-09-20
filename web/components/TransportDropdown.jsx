import React from 'react';
import {inject, observer} from "mobx-react";
import restrictToRoles from "~/components/restrictToRoles";
import {MenuItem, NavDropdown} from "react-bootstrap";
import {NewTransportWarning} from "~/components/NewTransportWarning";

export const TransportDropdown = restrictToRoles(['dispo'])(inject('transports')(observer(({transports}) =>
    transports.existNewTransports && <NavDropdown id="transports" title={<NewTransportWarning/>}>
        {transports.list.filter(t => t.state === 0).map(t =>
            <MenuItem key={t._id} onClick={transports.accept(t)}>
                {t.requester}
            </MenuItem>)}
    </NavDropdown>)));
