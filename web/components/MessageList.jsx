import {inject, observer} from "mobx-react";
import React from "react";
import states from "../shared/states";
import moment from "moment";
import {SortToggle} from "./SortToggle";
import restrictToRoles from "~/components/restrictToRoles";

const stateMap = {
    'delivered': 'zugestellt',
    'sent': 'gesendet',
    'pending': 'wird gesendet',
    'error': 'Fehler'
};

export default restrictToRoles(['dispo'])(inject('messages')(observer(({messages}) =>
    <div className="panel panel-default">
        <table className="table table-condensed table-striped">
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
                    <td>{m.callout && <i className="fa fa-bullhorn"/>}</td>
                </tr>)}
            </tbody>
        </table>
    </div>)));
