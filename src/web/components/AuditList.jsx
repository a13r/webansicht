import {inject, observer} from 'mobx-react';
import React from 'react';
import states from '../shared/states';
import moment from 'moment';

export default inject('store')(observer(({store}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th width="150px">Zeitpunkt</th>
                <th width="100px">Kennung</th>
                <th width="80px">Typ</th>
                <th width="150px">Status</th>
                <th>Letzter Standort</th>
                <th>Zielort</th>
                <th>Kdt./Fahrer</th>
                <th>ausgeblendet</th>
            </tr>
            </thead>
            <tbody>
            {store.audit.list.map(r =>
                <tr style={states.get(r.state).rowStyle} key={r._id}>
                    <td>{moment(r.since).format('L LT')}</td>
                    <td>{r.callSign}</td>
                    <td>{r.type}</td>
                    <td>{states.get(r.state).name}</td>
                    <td>{r.lastPosition}</td>
                    <td>{r.destination}</td>
                    <td>{r.contact}</td>
                    <td>{r.hidden && 'ja'}</td>
                </tr>)}
            </tbody>
        </table>
    </div>));
