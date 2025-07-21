import {inject, observer} from "mobx-react";
import React from "react";
import states from "../shared/states";
import moment from "moment";
import restrictToRoles from "~/components/restrictToRoles";
import Card from "react-bootstrap/Card";

const stateMap = {
    'delivered': 'zugestellt',
    'sent': 'gesendet',
    'pending': 'wird gesendet',
    'error': 'Fehler'
};

export default restrictToRoles(['dispo'])(inject('messages')(observer(({messages}) =>
    <Card>
        <table className="table table-condensed table-striped mb-0">
            <thead>
            <tr>
                <th>Zeitpunkt</th>
                <th>Ziel</th>
                <th>Nachricht</th>
                <th>Status</th>
                <th>Callout</th>
            </tr>
            </thead>
            <tbody>
            {messages.list.map(m =>
                <tr style={states.get(m.state).rowStyle} key={m._id}>
                    <td>{moment(m.createdAt).format('L HH:mm:ss')}</td>
                    <td>{m.resource ? `${m.resource.type} ${m.resource.callSign}` : m.destination}</td>
                    <td>{m.message}</td>
                    <td>{stateMap[m.state]}</td>
                    <td>
                        {m.callout && <span>
                            <i className="fa fa-bullhorn"/>
                            {m.callout.ackReceived && <span>
                                <i className="fa fa-check"/> {moment(m.callout.ackReceived).format('HH:mm:ss')}
                            </span>}
                        </span>}
                    </td>
                </tr>)}
            </tbody>
        </table>
    </Card>)));
