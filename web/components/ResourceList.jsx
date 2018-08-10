import React from "react";
import {inject, observer} from "mobx-react";
import moment from "moment";
import states from "../shared/states";
import "../styles/resourceList.css";

export default inject('auth', 'resources')(observer(({auth, resources}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th>TETRA</th>
                <th>Kennung</th>
                <th>Typ</th>
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
                    <td>{r.callSign}</td>
                    <td>{r.type}</td>
                    <td>{states.get(r.state).name}</td>
                    <td>{r.since && moment(r.since).format('LT')}</td>
                    <td>{r.lastPosition}</td>
                    <td>{r.destination}</td>
                    <td>{r.info}</td>
                    {auth.isDispo && <td>
                        {resources.selectedResourceId === r._id &&
                        <i className="pull-right fa fa-pencil" style={{color: '#000000'}}/>}
                    </td>}
                </tr>)}
            </tbody>
        </table>
    </div>));
