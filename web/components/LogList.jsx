import {inject, observer} from 'mobx-react';
import React from 'react';
import states from '../shared/states';
import moment from 'moment';
import _ from 'lodash';

const SortToggle = observer(({logStore}) => {
    const props = {
        className: `print-hidden glyphicon glyphicon-arrow-${logStore.sortOrder === 1 ? 'down' : 'up'}`,
        onClick: () => logStore.toggleSortOrder(),
        style: {
            cursor: 'pointer'
        }
    };
    return <i {...props}/>;
});

export default inject('store')(observer(({store}) =>
    <div className="panel panel-default">
        <table className="table table-condensed">
            <thead>
            <tr>
                <th>Zeitpunkt <SortToggle logStore={store.log}/></th>
                <th>Kennung</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Letzter Standort</th>
                <th>Zielort</th>
                <th>Kdt./Fahrer</th>
                <th>ausgeblendet</th>
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
                    <td>{r.hidden && 'ja'}</td>
                    <td>{_.get(r, 'user.username')}</td>
                </tr>)}
            </tbody>
        </table>
    </div>));
