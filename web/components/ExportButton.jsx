import React from "react";
import {inject, observer} from "mobx-react";
import {Button, FormGroup} from 'react-bootstrap';

export default inject('auth')(observer(({auth, path}) =>
    <div className="print-hidden">
        <form action={path} method="post">
            <input type="hidden" name="accessToken" value={auth.token}/>
            <FormGroup className="text-right">
                <Button type="submit"><i className="fa fa-table"/> Excel-Export</Button>
            </FormGroup>
        </form>
    </div>));
