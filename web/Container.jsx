import React from "react";
import {observer, Provider} from "mobx-react";
import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";
import {MenuItem, Nav, Navbar, NavDropdown, NavItem} from "react-bootstrap";
import {IndexLinkContainer, LinkContainer} from "react-router-bootstrap";
import {Router} from "react-router-dom";
import {Route} from "react-router";
import Overview from "./containers/overview";
import ResourceAdmin from "./containers/resourceAdmin";
import Log from "./containers/log";
import Settings from "./containers/settings";
import Journal from "./containers/journal";
import Stations from "./containers/stations";
import Transports from "./containers/transports";
import Map from "~/containers/map";
import stores from "./stores";
import forms from "./forms";
import "./styles/global.css";
import LoginForm from "./components/LoginForm";
import JournalEditor from "./components/JournalEditor";
import NotificationSystem from "react-notification-system";
import createBrowserHistory from "history/createBrowserHistory";
import {syncHistoryWithStore} from "mobx-react-router";
import restrictToRoles from "~/components/restrictToRoles";
import {TransportForm} from "~/components/TransportForm";
import {TodoDropdown} from "~/components/TodoDropdown";
import {TodoForm} from "~/components/TodoForm";
import {BottomNav} from "~/components/BottomNav";
import {TransportDropdown} from "~/components/TransportDropdown";
import MessageList from "~/components/MessageList";

const {auth, journal, notification, router} = stores;
const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, router);

const K = restrictToRoles(['dispo'])(({children}) => <kbd className="hidden-xs hidden-sm hidden-md">{children}</kbd>);

Notification.requestPermission().then(value => {
    if (value !== 'granted') {
        notification.warning('Systemweite Benachrichtigungen werden nicht angezeigt!', 'Achtung');
        stores.transports.showWebsiteNotification = true;
    }
});

@observer
export default class Container extends React.Component {
    render() {
        return <Provider {...stores} {...forms}>
            <Router history={history}>
                <div className="container-fluid">
                    <Navbar fixedTop fluid collapseOnSelect>
                        <Navbar.Header>
                            <Navbar.Brand>webansicht</Navbar.Brand>
                            <Navbar.Toggle/>
                        </Navbar.Header>
                        {auth.loggedIn &&
                        <Navbar.Collapse>
                            <Nav>
                                <IndexLinkContainer to="/">
                                    <NavItem><i className="fa fa-home"/> Übersicht</NavItem>
                                </IndexLinkContainer>
                                {auth.isDispo && <LinkContainer to="/journal">
                                    <NavItem><i className="fa fa-list"/> ETB</NavItem>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/log">
                                    <NavItem><i className="fa fa-history"/> Statusverlauf</NavItem>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/messages">
                                    <NavItem><i className="fa fa-envelope"/> Nachrichen</NavItem>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/resourceAdmin">
                                    <NavItem><i className="fa fa-ambulance"/> Ressourcen</NavItem>
                                </LinkContainer>}
                                {(auth.isDispo || auth.isStation) && <LinkContainer to="/stations">
                                    <NavItem><i className="fa fa-hospital-o"/> SanHiSts</NavItem>
                                </LinkContainer>}
                                {(auth.isDispo || auth.isStation || auth.hasTransports) && <LinkContainer to="/transports">
                                    <NavItem><i className="fa fa-ambulance"/> Transporte</NavItem>
                                </LinkContainer>}
                                <LinkContainer to="/map">
                                    <NavItem><i className="fa fa-map"/> Karte</NavItem>
                                </LinkContainer>
                                {auth.isDispo && <NavItem onClick={() => journal.createEntry()}>
                                    <i className="fa fa-plus-circle"/> Neuer ETB-Eintrag
                                </NavItem>}
                            </Nav>
                            <Nav pullRight>
                                <TransportDropdown/>
                                <TodoDropdown/>
                                {auth.user ?
                                    <NavDropdown id="user"
                                                 title={<span><i
                                                     className="fa fa-user-circle"/> {auth.user.name}</span>}>
                                        <LinkContainer to="/settings">
                                            <MenuItem><i className="fa fa-cogs"/> Einstellungen</MenuItem>
                                        </LinkContainer>
                                        <MenuItem onClick={() => auth.logout()}><i className="fa fa-sign-out"/> Abmelden</MenuItem>
                                    </NavDropdown> :
                                    <NavItem onClick={() => auth.logout()}>Abmelden</NavItem>}
                            </Nav>
                        </Navbar.Collapse>}
                    </Navbar>
                    <BottomNav/>
                    <Route path="/" exact component={Overview}/>
                    <Route path="/resourceAdmin" component={ResourceAdmin}/>
                    <Route path="/log" component={Log}/>
                    <Route path="/settings" component={Settings}/>
                    <Route path="/journal" component={Journal}/>
                    <Route path="/messages" component={MessageList}/>
                    <Route path="/stations" component={Stations}/>
                    <Route path="/transports" component={Transports}/>
                    <Route path="/map" component={Map}/>
                    {auth.loggedIn === false &&
                    <div className="row">
                        <div className="col-md-2 col-md-offset-5">
                            <LoginForm/>
                        </div>
                    </div>}
                    {auth.isDispo && <JournalEditor/>}
                    <TransportForm/>
                    <TodoForm/>
                    <NotificationSystem ref={ns => notification.init(ns)}/>
                </div>
            </Router>
        </Provider>;
    }
}
