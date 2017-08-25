import {inject, observer} from "mobx-react";
import React from "react";
import states from "../shared/states";
import moment from "moment";
import {SortToggle} from "./SortToggle";

export default inject('store')(observer(({store}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th>Zeitpunkt <SortToggle store={store.log}/></th>
                <th>Kennung</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Letzter Standort</th>
                <th>Zielort</th>
                <th>Kdt./Fahrer</th>
                <th>Info</th>
                <th><i className="fa fa-eye-slash"/></th>
                <th>Benutzer</th>
            </tr>
            </thead>
            <tbody>
            {store.log.list.map(r =>
                <tr style={states.get(r.state).rowStyle} key={r._id}>
                    <td>{r.since && moment(r.since).format('L LT')}</td>
                    <td>{r.callSign}</td>
                    <td>{r.type}</td>
                    <td>{states.get(r.state).name}</td>
                    <td>{r.lastPosition}</td>
                    <td>{r.destination}</td>
                    <td>{r.contact}</td>
                    <td>{r.info}</td>
                    <td>{r.hidden && <i className="fa fa-eye-slash"/>}</td>
                    <td>{r.user.initials}</td>
                </tr>)}
            </tbody>
        </table>
    </div>));
