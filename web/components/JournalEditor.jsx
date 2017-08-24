import React from "react";
import {Button} from "react-bootstrap";
import {Select, TextInput} from "./formControls";
import {inject, observer} from "mobx-react";
import {selectOptions} from "../stores/journal";

const SelectWithOptions = ({field, options}) =>
    <Select field={field}>
        {options.map(v => <option key={v}>{v}</option>)}
    </Select>;

export default inject('store')(observer(({store: {journal}}) =>
    <div className="panel panel-default">
        <div className="panel-heading">
            <h2 className="panel-title">Eintrag {journal.selectedEntryId ? 'bearbeiten' : 'erstellen'}</h2>
        </div>
        <div className="panel-body">
            <form onSubmit={journal.form.onSubmit}>
                <TextInput field={journal.form.$('text')}/>
                <TextInput field={journal.form.$('reporter')}/>
                <SelectWithOptions field={journal.form.$('reportedVia')}
                                   options={selectOptions.reportedVia}/>
                <SelectWithOptions field={journal.form.$('direction')}
                                   options={selectOptions.direction}/>
                <SelectWithOptions field={journal.form.$('priority')}
                                   options={selectOptions.priority}/>
                <SelectWithOptions field={journal.form.$('state')}
                                   options={selectOptions.state}/>
                <TextInput field={journal.form.$('comment')}/>
                <div className="btn-toolbar">
                    <Button type="submit" bsStyle="primary">speichern</Button>
                    <Button onClick={() => journal.createEntry()}>
                        abbrechen/neu
                    </Button>
                </div>
            </form>
        </div>
    </div>));
