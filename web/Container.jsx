import React from "react";
import {observer, Provider} from "mobx-react";
import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";
import {MenuItem, Nav, Navbar, NavDropdown, NavItem} from "react-bootstrap";
import {IndexLinkContainer, LinkContainer} from "react-router-bootstrap";
import {Router} from "react-router-dom";
import {Redirect, Route} from "react-router";
import Overview from "./containers/overview";
import Admin from "./containers/admin";
import Log from "./containers/log";
import UserSettings from "./containers/userSettings";
import Journal from "./containers/journal";
import Stations from "./containers/stations";
import MobxReactFormDevTools from "mobx-react-form-devtools";
import stores from "./stores";
import "./styles/global.css";
import LoginForm from "./components/LoginForm";
import JournalEditor from "./components/JournalEditor";
import NotificationSystem from "react-notification-system";
import createBrowserHistory from "history/createBrowserHistory";
import {syncHistoryWithStore} from "mobx-react-router";

const {auth, router} = stores;
const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, router);

@observer
export default class Container extends React.Component {
    render() {
        return <Provider store={stores}>
            <Router history={history}>
                <div className="container-fluid">
                    <Navbar fluid collapseOnSelect>
                        <Navbar.Header>
                            <Navbar.Brand>µ-webansicht</Navbar.Brand>
                            <Navbar.Toggle/>
                        </Navbar.Header>
                        {auth.loggedIn &&
                        <Navbar.Collapse>
                            {auth.isDispo &&
                            <Nav>
                                <IndexLinkContainer to="/">
                                    <NavItem><i className="fa fa-home"/> Übersicht <kbd>F1</kbd></NavItem>
                                </IndexLinkContainer>
                                <LinkContainer to="/journal">
                                    <NavItem><i className="fa fa-list"/> Einsatztagebuch <kbd>F2</kbd></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/log">
                                    <NavItem><i className="fa fa-history"/> Statusverlauf <kbd>F3</kbd></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/resources">
                                    <NavItem><i className="fa fa-ambulance"/> Ressourcen <kbd>F4</kbd></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/stations">
                                    <NavItem><i className="fa fa-hospital-o"/> SanHiSts <kbd>F5</kbd></NavItem>
                                </LinkContainer>
                                <NavItem onClick={() => stores.journal.createEntry()}>
                                    <i className="fa fa-plus-circle"/> Neuer ETB-Eintrag <kbd>CTRL+E</kbd>
                                </NavItem>
                            </Nav>}
                            <Nav pullRight>
                                {auth.user ?
                                    <NavDropdown id="user"
                                                 title={<span><i
                                                     className="fa fa-user-circle"/> {auth.user.name}</span>}>
                                        {auth.isDispo &&
                                        <LinkContainer to="/userSettings">
                                            <MenuItem><i className="fa fa-cogs"/> Einstellungen</MenuItem>
                                        </LinkContainer>}
                                        <MenuItem onClick={() => auth.logout()}><i className="fa fa-sign-out"/> Abmelden</MenuItem>
                                    </NavDropdown> :
                                    <NavItem onClick={() => auth.logout()}>Abmelden</NavItem>}
                            </Nav>
                        </Navbar.Collapse>}
                    </Navbar>
                    <Route path="/" exact component={Overview}/>
                    <Route path="/resources" component={Admin}/>
                    <Route path="/log" component={Log}/>
                    <Route path="/userSettings" component={UserSettings}/>
                    <Route path="/journal" component={Journal}/>
                    <Route path="/stations" component={Stations}/>
                    {stores.auth.loggedIn === false &&
                    <div className="row">
                        <Redirect to="/"/>
                        <div className="col-md-2 col-md-offset-5">
                            <LoginForm/>
                        </div>
                    </div>}
                    {stores.auth.isDispo && <JournalEditor/>}
                    <NotificationSystem ref={ns => stores.notification.system = ns}/>
                    {process.env.NODE_ENV === 'development' && <MobxReactFormDevTools.UI/>}
                </div>
            </Router>
        </Provider>;
    }
}
