import React from "react";
import {Button} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import states from "../shared/states";
import {inject, observer} from "mobx-react";
import _ from "lodash";
import {PositionTextInput} from "~/components/formControls";
import {SendMessageForm} from "~/components/SendMessageForm";

export default inject('resources', 'log')(observer(({resources, log, onClose}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">
                Status ändern
                {onClose && <Button bsSize="xs" className="close" onClick={onClose}>
                    <i className="fa fa-times"></i>
                </Button>}
            </h2>
        </div>
        <div className="panel-body">
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
                <div className="btn-toolbar form-group">
                    <Button type="submit" bsStyle="primary">Speichern</Button>
                    <Button onClick={log.goToResourceId(resources.form.$('_id').value)}>
                        <i className="fa fa-fw fa-history"/>
                    </Button>
                </div>
            </form>
            {resources.sendMessageVisible && <SendMessageForm form={resources.sendMessageForm}/>}
        </div>
    </div>));
