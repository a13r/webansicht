import React from "react";
import {Provider} from "mobx-react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import PropTypes from "prop-types";
import {Nav, Navbar, NavItem} from "react-bootstrap";
import {IndexLinkContainer, LinkContainer} from "react-router-bootstrap";
import {BrowserRouter, HashRouter} from "react-router-dom";
import {Route} from "react-router";
import Overview from "./containers/overview";
import Admin from './containers/admin';
import Log from './containers/log';
import MobxReactFormDevTools from 'mobx-react-form-devtools';

export default class Container extends React.Component {
    static propTypes = {
        store: PropTypes.object
    };

    render() {
        return <Provider store={this.props.store}>
            <BrowserRouter>
                <div className="container-fluid">
                    <Navbar fluid collapseOnSelect>
                        <Navbar.Header>
                            <Navbar.Brand>µ-webansicht</Navbar.Brand>
                            <Navbar.Toggle/>
                        </Navbar.Header>
                        <Navbar.Collapse>
                        <Nav>
                            <IndexLinkContainer to="/">
                                <NavItem>Übersicht</NavItem>
                            </IndexLinkContainer>
                            <LinkContainer to="/admin">
                                <NavItem>Ressourcenverwaltung</NavItem>
                            </LinkContainer>
                            <LinkContainer to="/log">
                                <NavItem>Protokoll</NavItem>
                            </LinkContainer>
                        </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                    <Route path="/" exact component={Overview}/>
                    <Route path="/admin" component={Admin}/>
                    <Route path="/log" component={Log}/>
                    {process.env.NODE_ENV === 'development' && <MobxReactFormDevTools.UI/>}
                </div>
            </BrowserRouter>
        </Provider>;
    }
}
