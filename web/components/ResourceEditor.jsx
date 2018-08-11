import React from "react";
import {Button} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import states from "../shared/states";
import {inject, observer} from "mobx-react";
import _ from "lodash";
import {PositionTextInput} from "~/components/formControls";

export default inject('resources')(observer(({resources}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Status ändern</h2>
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
                <Button type="submit">Speichern</Button>
            </form>
        </div>
    </div>));
