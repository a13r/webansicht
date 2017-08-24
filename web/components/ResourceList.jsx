import React from "react";
import {inject, observer} from "mobx-react";
import moment from "moment";
import states from "../shared/states";
import "../styles/resourceList.css";

export default inject('store')(observer(({store: {resources}}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th>Kennung</th>
                <th>Typ</th>
                <th>Status</th>
                <th>seit</th>
                <th>Letzter Standort</th>
                <th>Zielort</th>
                <th>Kdt./Fahrer</th>
                <th/>
            </tr>
            </thead>
            <tbody>
            {resources.list.map(r =>
                <tr style={states.get(r.state).rowStyle} className="resourceRow"
                    key={r._id} onClick={() => resources.selectResource(r._id)}>
                    <td>{r.callSign}</td>
                    <td>{r.type}</td>
                    <td>{states.get(r.state).name}</td>
                    <td>{r.since && moment(r.since).format('LT')}</td>
                    <td>{r.lastPosition}</td>
                    <td>{r.destination}</td>
                    <td>{r.contact}</td>
                    <td>
                        {resources.selectedResourceId === r._id &&
                        <i className="pull-right fa fa-pencil" style={{color: '#000000'}}/>}
                    </td>
                </tr>)}
            </tbody>
        </table>
    </div>));
