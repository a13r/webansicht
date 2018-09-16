import React from 'react';
import {auth} from '../stores';
import {observer} from 'mobx-react';

export default function authenticate(Component) {
    return observer(({props}) => auth.loggedIn === true && <Component {...props}/>);
}
