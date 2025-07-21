import React from "react";
import {inject, observer} from "mobx-react";
import {Button, FormGroup} from 'react-bootstrap';

export default inject('auth')(observer(({auth, path, ...props}) =>
    <span {...props}>
        <form action={path} method="post" className="d-inline d-print-none">
            <input type="hidden" name="accessToken" value={auth.token}/>
            <Button type="submit"><i className="fa fa-table"/> Excel-Export</Button>
        </form>
    </span>));
