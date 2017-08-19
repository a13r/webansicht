import React from "react";
import {Provider} from "mobx-react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import PropTypes from "prop-types";
import {Nav, Navbar, NavItem} from "react-bootstrap";
import {IndexLinkContainer, LinkContainer} from "react-router-bootstrap";
import {BrowserRouter} from "react-router-dom";
import {Route} from "react-router";
import Overview from "./containers/overview";
import Admin from './containers/admin';

export default class Container extends React.Component {
    static propTypes = {
        store: PropTypes.object
    };

    render() {
        return <Provider store={this.props.store}>
            <BrowserRouter>
                <div className="container-fluid">
                    <Navbar fluid>
                        <Navbar.Header>
                            <Navbar.Brand>µ-webansicht</Navbar.Brand>
                        </Navbar.Header>
                        <Nav>
                            <IndexLinkContainer to="/">
                                <NavItem>Übersicht</NavItem>
                            </IndexLinkContainer>
                            <LinkContainer to="/admin">
                                <NavItem>Ressourcenverwaltung</NavItem>
                            </LinkContainer>
                        </Nav>
                    </Navbar>
                    <Route path="/" exact component={Overview}/>
                    <Route path="/admin" component={Admin}/>
                </div>
            </BrowserRouter>
        </Provider>;
    }
}
