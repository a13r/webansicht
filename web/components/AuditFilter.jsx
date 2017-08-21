import {inject, observer} from 'mobx-react';
import React from 'react';
import {Select} from "./formControls";

export default inject('store')(observer(({store}) =>
    <div className="panel panel-default print-hidden">
        <div className="panel-heading">
            <h2 className="panel-title">Filter</h2>
        </div>
        <div className="panel-body">
            <form>
                <Select field={store.audit.form.$('resource_id')}>
                    <option value="">(alle)</option>
                    {store.resources.list.map(r => <option key={r._id} value={r._id}>{r.callSign}</option>)}
                </Select>
            </form>
        </div>
    </div>));
