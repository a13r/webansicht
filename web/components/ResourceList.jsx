import React from "react";
import {inject, observer} from "mobx-react";
import moment from "moment";
import states from "../shared/states";
import "../styles/resourceList.css";
import {OverlayTrigger, Popover} from "react-bootstrap";
import {priorities, types} from "~/shared/strings";

const TransportSummary = ({diagnose, requester, priority, type, destination}) =>
    <div>
        <dl>
            <dt>Anfordernde Stelle</dt>
            <dd>{requester}</dd>
            <dt>Dringlichkeit</dt>
            <dd>{priorities[priority]}</dd>
            <dt>Transportart</dt>
            <dd>{types[type]}</dd>
            <dt>Diagnose</dt>
            <dd>{diagnose}</dd>
            <dt>Ziel</dt>
            <dd>{destination.hospital} {destination.station}</dd>
        </dl>
    </div>;

export default inject('auth', 'resources', 'transports')(observer(({auth, resources, transports}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th>TETRA</th>
                <th>Typ</th>
                <th>Kennung</th>
                <th>Status</th>
                <th>seit</th>
                <th>Letzter Standort</th>
                <th>Zielort</th>
                <th>Info</th>
                {auth.isDispo && <th/>}
            </tr>
            </thead>
            <tbody>
            {resources.list.map(r =>
                <tr style={states.get(r.state).rowStyle} className={auth.isDispo ? 'resourceRow' : ''}
                    key={r._id} onClick={auth.isDispo ? () => resources.selectResource(r._id) : null}>
                    <td>{r.tetra}</td>
                    <td>{r.type}</td>
                    <td>{r.callSign}</td>
                    <td>{states.get(r.state).name}</td>
                    <td>{r.since && moment(r.since).format('LT')}</td>
                    <td>{r.lastPosition}</td>
                    <td>{r.destination}</td>
                    <td>{r.info}</td>
                    {auth.isDispo && <td className="text-right">
                        {transports.openTransports(r).map((t, i) =>
                            <OverlayTrigger key={i} container={this} trigger={['hover', 'focus']} placement="bottom"
                                            overlay={<Popover title={`Transport ${transports.list.indexOf(t)+1}`}><TransportSummary {...t}/></Popover>}>
                                <span><i className="fa fa-lg fa-fw fa-ambulance" key={i} onClick={transports.edit(t)}/></span>
                            </OverlayTrigger>)}
                        {resources.selectedResourceId === r._id && <i className="fa fa-lg fa-fw fa-pencil"/>}
                    </td>}
                </tr>)}
            </tbody>
        </table>
    </div>));
