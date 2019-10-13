import authenticate from "~/components/authenticate";
import {inject, observer} from "mobx-react";
import React from "react";
import moment from "moment";
import {Button, FormGroup} from "react-bootstrap";
import {priorities, states, types} from "~/shared/strings";
import ExportButton from "~/components/ExportButton";

const stateClass = {
    0: 'bg-danger',
    1: 'bg-warning',
    2: 'bg-warning',
    3: 'bg-success',
    4: 'bg-success'
};
const priorityClass = {
    1: 'bg-warning',
    2: 'bg-danger'
};

function priorityBgClass(transport) {
    if (transport.state < 3) {
        // nicht abgeschlossen
        return priorityClass[transport.priority];
    }
    return '';
}

export default authenticate(inject('transports')(observer(({transports}) =>
    <div>
        <FormGroup>
            <Button onClick={transports.createNew}><i className="fa fa-plus fa-fw"/> Abtransport anfordern</Button>
        </FormGroup>
        <div className="panel panel-default">
            <table className="table table-bordered table-condensed table-responsive">
                <thead>
                <tr>
                    <th style={{width: '3em'}}>#</th>
                    <th style={{width: '10em'}}>Zeitpunkt</th>
                    <th style={{width: '10em'}}>Status</th>
                    <th>Anfordernde Stelle</th>
                    <th>Dringlichkeit</th>
                    <th>Transportart</th>
                    <th>Verdachtsdiagnose</th>
                    <th>Ziel</th>
                    <th>Ressource</th>
                </tr>
                </thead>
                <tbody>
                {transports.list.map((t, i) =>
                    <tr key={t._id} style={{cursor: transports.editAllowed(t) ? 'pointer' : 'not-allowed'}}
                        className={priorityBgClass(t)}
                        onClick={transports.edit(t)}>
                        <td>{i+1}</td>
                        <td>{moment(t.createdAt).format('L LT')}</td>
                        <td className={stateClass[t.state]}>{states[t.state]}</td>
                        <td>{t.requester}</td>
                        <td>{priorities[t.priority]}</td>
                        <td>{types[t.type]} {t.hasCompany && '+ Bgl.'}</td>
                        <td>{t.diagnose}</td>
                        <td>{t.destination.hospital} {t.destination.station}</td>
                        <td>{t.resource && <span>{t.resource.type} {t.resource.callSign}</span>}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>
        <div>
            <ExportButton path="/transports.xlsx"/>
        </div>
    </div>)));
