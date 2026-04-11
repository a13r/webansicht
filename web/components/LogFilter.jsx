import {inject, observer} from 'mobx-react';
import React from 'react';
import {Select} from "./formControls";
import Card from "react-bootstrap/Card";

export default inject('log', 'resources')(observer(({log, resources}) =>
    <Card className="print-hidden">
        <Card.Header>Filter</Card.Header>
        <Card.Body>
            <form>
                <Select field={log.form.$('resource_id')}>
                    <option value="">(alle)</option>
                    {resources.list.map(r => <option key={r._id} value={r._id}>{r.callSign}</option>)}
                </Select>
            </form>
        </Card.Body>
    </Card>));
