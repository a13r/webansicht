import React from "react";
import {Button, ButtonToolbar} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import states from "../shared/states";
import {inject, observer} from "mobx-react";
import _ from "lodash";
import {PositionTextInput} from "~/components/formControls";
import {SendMessageForm} from "~/components/SendMessageForm";
import Card from "react-bootstrap/Card";

export default inject('resources', 'log')(observer(({resources, log, onClose}) =>
    <Card>
        <Card.Header>
            Status ändern
            {onClose && <Button bsSize="xs" className="close" onClick={onClose}>
                <i className="fa fa-times"></i>
            </Button>}
        </Card.Header>
        <Card.Body>
            <form onSubmit={resources.form.onSubmit}>
                <Select field={resources.form.$('_id')}>
                    {resources.list.map(r => <option value={r._id} key={r._id}>{r.type} {r.callSign}</option>)}
                </Select>
                <Select field={resources.form.$('state')}>
                    {_.keys(states).map(key => <option key={key} value={key}>{key} – {states[key].name}</option>)}
                </Select>
                <PositionTextInput field={resources.form.$('lastPosition')}
                                   onClickHome={() => resources.setHome('lastPosition')}
                                   onClickSwap={resources.swapPositions}/>
                <PositionTextInput field={resources.form.$('destination')}
                                   onClickHome={() => resources.setHome('destination')}
                                   onClickSwap={resources.swapPositions}/>
                <TextInput field={resources.form.$('info')}/>
                <ButtonToolbar className="gap-2">
                    <Button type="submit" variant="primary">Speichern</Button>
                    <Button onClick={log.goToResourceId(resources.form.$('_id').value)} variant="secondary">
                        <i className="fa fa-fw fa-history"/>
                    </Button>
                </ButtonToolbar>
            </form>
            {resources.sendMessageVisible && <SendMessageForm form={resources.sendMessageForm}/>}
        </Card.Body>
    </Card>));
