import React from "react";
import {inject, observer} from "mobx-react";
import moment from "moment";
import "../styles/resourceList.css";
import {SortToggle} from "./SortToggle";
import "../styles/journalList.css";
import Card from "react-bootstrap/Card";

function priorityClass(e) {
    if (e.priority === 'hoch')
        return 'bg-danger-subtle';
}

function stateClass(e) {
    if (e.state === 'erledigt')
        return 'bg-success-subtle';
    if (e.state === 'bearb.')
        return 'bg-warning-subtle';
    if (e.state === 'offen')
        return 'bg-danger-subtle';
}

export default inject('journal')(observer(({journal}) =>
    <Card className="mb-3">
        <table className="table table-condensed table-hover journal-table mb-0">
            <thead>
            <tr>
                <th style={{width: '10em'}}>Zeitpunkt <SortToggle store={journal}/></th>
                <th style={{}}>Eintrag</th>
                <th style={{width: '10%'}}>Melder</th>
                <th style={{width: '8em'}}>Meldeweg</th>
                <th style={{width: '5em'}}>Ein/Aus</th>
                <th style={{width: '6em'}}>Priorität</th>
                <th style={{width: '5em'}}>Status</th>
                <th style={{width: '15%'}}>Vermerk</th>
                <th style={{width: '5em'}}>Trsp.</th>
                <th style={{width: '5em'}}>Kürzel</th>
            </tr>
            </thead>
            <tbody>
            {journal.list.map(e =>
                <tr className={`journal-list ${e.state !== 'erledigt' ? priorityClass(e) : ''}`}
                    key={e._id} onClick={() => journal.selectEntry(e._id)}>
                    <td>{moment(e.createdAt).format('L LT')}</td>
                    <td>{e.text}</td>
                    <td>{e.reporter}</td>
                    <td>{e.reportedVia}</td>
                    <td>{e.direction}</td>
                    <td className={priorityClass(e)}>{e.priority}</td>
                    <td className={stateClass(e)}>{e.state}</td>
                    <td>{e.comment}</td>
                    <td>{e.transport && <i className="fa fa-ambulance"/>}</td>
                    <td>{e.user.initials}</td>
                </tr>)}
            </tbody>
        </table>
    </Card>));
