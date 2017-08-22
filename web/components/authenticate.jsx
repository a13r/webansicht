import React from 'react';
import {auth} from '../stores';
import {observer} from 'mobx-react';

export default function authenticate(Component) {
    return observer(React.createClass({
        render() {
            return auth.loggedIn === true && <Component {...this.props}/>;
        }
    }));
}
