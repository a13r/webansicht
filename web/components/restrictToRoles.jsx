import React from "react";
import {auth} from "../stores";
import {observer} from "mobx-react";
import _ from 'lodash';

export default function restrictToRoles(roles) {
    return (Component) => observer(({props}) => {
        if (auth.user && _.intersection(roles, auth.user.roles).length > 0) {
            return <Component {...props}/>;
        }
        return false;
    });
};
