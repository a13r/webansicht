import authenticate from "~/components/authenticate";
import {inject, observer} from "mobx-react";
import React from "react";
import moment from "moment";

export default authenticate(inject('transports')(observer(({transports}) =>
    <div className="panel panel-default">
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    <th style={{width: '10em'}}>Zeitpunkt</th>
                    <th>Beschreibung</th>
                    <th style={{width: '5em'}}>Status</th>
                </tr>
            </thead>
            <tbody>
                {transports.list.map(t =>
                    <tr key={t._id}>
                        <td>{moment(t.createdAt).format('L LT')}</td>
                        <td>{t.text}</td>
                        <td>{t.state}</td>
                    </tr>)}
            </tbody>
        </table>
    </div>)));
