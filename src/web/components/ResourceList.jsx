import React from "react";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";
import moment from "moment";
import states from "../shared/states";
import _ from 'lodash';

@inject('store')
@observer
export default class ResourceList extends React.Component {
    static propTypes = {
        store: PropTypes.object
    };

    render() {
        const {resources} = this.props.store;
        const rowStyle = {
            cursor: 'pointer'
        };
        return <div className="panel panel-default">
            <table className="table table-condensed">
                <thead>
                <tr>
                    <th width="100px">Kennung</th>
                    <th width="80px">Typ</th>
                    <th width="150px">Status</th>
                    <th width="80px">seit</th>
                    <th>Letzter Standort</th>
                    <th>Zielort</th>
                    <th>Kdt./Fahrer</th>
                </tr>
                </thead>
                <tbody>
                {resources.list.map(r =>
                    <tr style={_.assign({}, rowStyle, states.get(r.state).rowStyle)} className="resourceRow"
                        key={r._id} onClick={() => resources.selectResource(r._id)}>
                        <td>{r.callSign}</td>
                        <td>{r.type}</td>
                        <td>{states.get(r.state).name}</td>
                        <td>{moment(r.since).format('LT')}</td>
                        <td>{r.lastPosition}</td>
                        <td>{r.destination}</td>
                        <td>{r.contact}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>;
    }
}
