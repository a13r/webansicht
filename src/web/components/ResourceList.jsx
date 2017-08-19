import React from "react";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";
import {Button} from "react-bootstrap";
import moment from "moment";

@inject('store')
@observer
export default class ResourceList extends React.Component {
    static propTypes = {
        store: PropTypes.object
    };

    render() {
        const {resources} = this.props.store;
        const {states} = resources;
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
                    <th width="30px"/>
                </tr>
                </thead>
                <tbody>
                {resources.list.map(r =>
                    <tr style={states[r.state].rowStyle} key={r._id}>
                        <td>{r.callSign}</td>
                        <td>{r.type}</td>
                        <td>{states[r.state].name}</td>
                        <td>{moment(r.since).format('LT')}</td>
                        <td>{r.lastPosition}</td>
                        <td>{r.destination}</td>
                        <td>{r.contact}</td>
                        <td>
                            <Button bsStyle="default" bsSize="xsmall" className="pull-right"
                                    onClick={() => resources.selectResource(r._id)}>
                                <i className="glyphicon glyphicon-pencil"/>
                            </Button>
                        </td>
                    </tr>)}
                </tbody>
            </table>
        </div>;
    }
}
