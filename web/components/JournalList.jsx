import React from "react";
import {inject, observer} from "mobx-react";
import moment from "moment";
import "../styles/resourceList.css";
import {SortToggle} from "./SortToggle";
import "../styles/journalList.css";

export default inject('store')(observer(({store: {journal}}) =>
    <div className="panel panel-default">
        <table className="table table-condensed table-hover journal-table">
            <thead>
            <tr>
                <th style={{width: '10em'}}>Zeitpunkt <SortToggle store={journal}/></th>
                <th style={{}}>Eintrag</th>
                <th style={{width: '10%'}}>Melder</th>
                <th style={{width: '8em'}}>Meldeweg</th>
                <th style={{width: '5em'}}>Ein/Aus</th>
                <th style={{width: '5em'}}>Priorität</th>
                <th style={{width: '5em'}}>Status</th>
                <th style={{width: '15%'}}>Vermerk</th>
                <th style={{width: '6em'}}>Benutzer</th>
            </tr>
            </thead>
            <tbody>
            {journal.list.map(e =>
                <tr className="journal-list" key={e._id} onClick={() => journal.selectEntry(e._id)}>
                    <td>{moment(e.createdAt).format('L LT')}</td>
                    <td>{e.text}</td>
                    <td>{e.reporter}</td>
                    <td>{e.reportedVia}</td>
                    <td>{e.direction}</td>
                    <td>{e.priority}</td>
                    <td>{e.state}</td>
                    <td>{e.comment}</td>
                    <td>{e.user.username}</td>
                </tr>)}
            </tbody>
        </table>
    </div>));
