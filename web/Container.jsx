import React from "react";
import {observer, Provider} from "mobx-react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";
import {MenuItem, Nav, Navbar, NavDropdown, NavItem} from "react-bootstrap";
import {IndexLinkContainer, LinkContainer} from "react-router-bootstrap";
import {BrowserRouter} from "react-router-dom";
import {Route} from "react-router";
import Overview from "./containers/overview";
import Admin from "./containers/admin";
import Log from "./containers/log";
import UserSettings from "./containers/userSettings";
import Journal from "./containers/journal";
import MobxReactFormDevTools from "mobx-react-form-devtools";
import store from "./stores";
import "./styles/global.css";
import LoginForm from "./components/LoginForm";

const {auth} = store;

@observer
export default class Container extends React.Component {
    render() {
        return <Provider store={store}>
            <BrowserRouter>
                <div className="container-fluid">
                    <Navbar fluid collapseOnSelect>
                        <Navbar.Header>
                            <Navbar.Brand>µ-webansicht</Navbar.Brand>
                            <Navbar.Toggle/>
                        </Navbar.Header>
                        {auth.loggedIn &&
                        <Navbar.Collapse>
                            <Nav>
                                <IndexLinkContainer to="/">
                                    <NavItem><i className="glyphicon glyphicon-list"/> Übersicht</NavItem>
                                </IndexLinkContainer>
                                <LinkContainer to="/admin">
                                    <NavItem><i className="glyphicon glyphicon-cog"/> Ressourcenverwaltung</NavItem>
                                </LinkContainer>
                                <LinkContainer to="/log">
                                    <NavItem><i className="glyphicon glyphicon-time"/> Änderungsverlauf</NavItem>
                                </LinkContainer>
                                <LinkContainer to="/journal">
                                    <NavItem>Einsatzprotokoll</NavItem>
                                </LinkContainer>
                            </Nav>
                            <Nav pullRight>
                                {auth.user ?
                                    <NavDropdown id="user"
                                                 title={<span><i className="glyphicon glyphicon-user"/> {auth.user.name}</span>}>
                                        <LinkContainer to="/userSettings">
                                            <MenuItem>Einstellungen</MenuItem>
                                        </LinkContainer>
                                        <MenuItem onClick={() => auth.logout()}>Abmelden</MenuItem>
                                    </NavDropdown> :
                                    <NavItem onClick={() => auth.logout()}>Abmelden</NavItem>}
                            </Nav>
                        </Navbar.Collapse>}
                    </Navbar>
                    <Route path="/" exact component={Overview}/>
                    <Route path="/admin" component={Admin}/>
                    <Route path="/log" component={Log}/>
                    <Route path="/userSettings" component={UserSettings}/>
                    <Route path="/journal" component={Journal}/>
                    {store.auth.loggedIn === false &&
                    <div className="row">
                        <div className="col-md-2 col-md-offset-5">
                            <LoginForm/>
                        </div>
                    </div>}
                    {process.env.NODE_ENV === 'development' && <MobxReactFormDevTools.UI/>}
                </div>
            </BrowserRouter>
        </Provider>;
    }
}
