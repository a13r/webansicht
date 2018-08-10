import React from "react";
import {inject, observer} from "mobx-react";
import {Button, FormGroup} from 'react-bootstrap';

export default inject('auth')(observer(({auth}) =>
    <div className="print-hidden">
        <form action="/export.xlsx" method="post">
            <input type="hidden" name="accessToken" value={auth.token}/>
            <FormGroup className="text-right">
                <Button type="submit"><i className="fa fa-table"/> Excel-Export</Button>
            </FormGroup>
        </form>
    </div>));
