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
import forms from "./forms";
import "./styles/global.css";
import LoginForm from "./components/LoginForm";
import JournalEditor from "./components/JournalEditor";
import NotificationSystem from "react-notification-system";
import createBrowserHistory from "history/createBrowserHistory";
import {syncHistoryWithStore} from "mobx-react-router";
import DeleteResourceModal from "~/components/DeleteResourceModal";

const {auth, notification, router} = stores;
const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, router);

const K = ({children}) => <kbd className="hidden-xs hidden-sm hidden-md">{children}</kbd>;

@observer
export default class Container extends React.Component {
    render() {
        return <Provider {...stores} {...forms}>
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
                                    <NavItem><i className="fa fa-home"/> Übersicht <K>F1</K></NavItem>
                                </IndexLinkContainer>
                                <LinkContainer to="/journal">
                                    <NavItem><i className="fa fa-list"/> Einsatztagebuch <K>F2</K></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/log">
                                    <NavItem><i className="fa fa-history"/> Statusverlauf <K>F3</K></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/resources">
                                    <NavItem><i className="fa fa-ambulance"/> Ressourcen <K>F4</K></NavItem>
                                </LinkContainer>
                                <LinkContainer to="/stations">
                                    <NavItem><i className="fa fa-hospital-o"/> SanHiSts <K>F5</K></NavItem>
                                </LinkContainer>
                                <NavItem onClick={() => stores.journal.createEntry()}>
                                    <i className="fa fa-plus-circle"/> Neuer ETB-Eintrag <K>CTRL+E</K>
                                </NavItem>
                            </Nav>}
                            {auth.isStation &&
                            <Nav>
                                <IndexLinkContainer to="/">
                                    <NavItem><i className="fa fa-home"/> Übersicht</NavItem>
                                </IndexLinkContainer>
                                <LinkContainer to="/stations">
                                    <NavItem><i className="fa fa-hospital-o"/> SanHiSts</NavItem>
                                </LinkContainer>
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
                    {auth.loggedIn === false &&
                    <div className="row">
                        <div className="col-md-2 col-md-offset-5">
                            <LoginForm/>
                        </div>
                    </div>}
                    {auth.isDispo && <JournalEditor/>}
                    <DeleteResourceModal/>
                    <NotificationSystem ref={ns => notification.system = ns}/>
                    {process.env.NODE_ENV === 'development' && <MobxReactFormDevTools.UI/>}
                </div>
            </Router>
        </Provider>;
    }
}
