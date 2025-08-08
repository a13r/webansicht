import React from "react";
import {observer, Provider} from "mobx-react";
import {Container as BsContainer, Nav, Navbar, NavDropdown} from "react-bootstrap";
import {LinkContainer} from "react-router-bootstrap";
import {Route, Routes} from "react-router-dom";
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
import LoginForm from "./components/LoginForm";
import JournalEditor from "./components/JournalEditor";
import restrictToRoles from "~/components/restrictToRoles";
import {TransportForm} from "~/components/TransportForm";
import {TodoDropdown} from "~/components/TodoDropdown";
import {TodoForm} from "~/components/TodoForm";
import {TransportDropdown} from "~/components/TransportDropdown";
import MessageList from "~/components/MessageList";
import MobxRouter from "~/components/MobxRouter";
import {ToastContainer} from "react-toastify";

const {auth, journal, notification, router} = stores;

const K = restrictToRoles(['dispo'])(({children}) => <kbd className="d-none d-lg-block">{children}</kbd>);

Notification.requestPermission().then(value => {
    if (value !== 'granted') {
        notification.warning('Systemweite Benachrichtigungen werden nicht angezeigt!');
        stores.transports.showWebsiteNotification = true;
    }
});

const Container = observer(() =>
    <Provider {...stores} {...forms}>
        <MobxRouter store={router}>
            <div className="container-fluid">
                <Navbar fixed="top" expand="lg" collapseOnSelect bg="dark" data-bs-theme="dark">
                    <BsContainer fluid>
                        <Navbar.Brand>webansicht</Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                        {auth.loggedIn && <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="me-auto">
                                <LinkContainer to="/">
                                    <Nav.Link><i className="fa fa-home"/> Übersicht</Nav.Link>
                                </LinkContainer>
                                {auth.isDispo && <LinkContainer to="/journal">
                                    <Nav.Link><i className="fa fa-list"/> ETB</Nav.Link>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/log">
                                    <Nav.Link><i className="fa fa-history"/> Statusverlauf</Nav.Link>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/messages">
                                    <Nav.Link><i className="fa fa-envelope"/> Nachrichen</Nav.Link>
                                </LinkContainer>}
                                {auth.isDispo && <LinkContainer to="/resourceAdmin">
                                    <Nav.Link><i className="fa fa-ambulance"/> Ressourcen</Nav.Link>
                                </LinkContainer>}
                                {(auth.isDispo || auth.isStation) && <LinkContainer to="/stations">
                                    <Nav.Link><i className="fa fa-tent"/> SanHiSts</Nav.Link>
                                </LinkContainer>}
                                {(auth.isDispo || auth.isStation || auth.hasTransports) &&
                                    <LinkContainer to="/transports">
                                        <Nav.Link><i className="fa fa-hospital"/> Abtransporte</Nav.Link>
                                    </LinkContainer>}
                                <LinkContainer to="/map">
                                    <Nav.Link><i className="fa fa-map"/> Karte</Nav.Link>
                                </LinkContainer>
                                {auth.isDispo && <Nav.Link onClick={() => journal.createEntry()}>
                                    <i className="fa fa-plus-circle"/> Neuer ETB-Eintrag
                                </Nav.Link>}
                            </Nav>
                            <Nav>
                                <TransportDropdown/>
                                <TodoDropdown/>
                                <NavDropdown id="user"
                                                title={<span><i
                                                    className="fa fa-user-circle"/> {auth.user.name}</span>}>
                                    <LinkContainer to="/settings">
                                        <NavDropdown.Item><i
                                            className="fa fa-cogs"/> Einstellungen</NavDropdown.Item>
                                    </LinkContainer>
                                    <NavDropdown.Item onClick={() => auth.logout()}><i
                                        className="fa fa-sign-out"/> Abmelden</NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        </Navbar.Collapse>}
                    </BsContainer>
                </Navbar>
                {/*<BottomNav/>*/}

                <Routes>
                    <Route path="/" element={<Overview/>}/>
                    <Route path="/resourceAdmin" element={<ResourceAdmin/>}/>
                    <Route path="/log" element={<Log/>}/>
                    <Route path="/settings" element={<Settings/>}/>
                    <Route path="/journal" element={<Journal/>}/>
                    <Route path="/messages" element={<MessageList/>}/>
                    <Route path="/stations" element={<Stations/>}/>
                    <Route path="/transports" element={<Transports/>}/>
                    <Route path="/map" element={<Map/>}/>
                </Routes>

                {/* Conditional rendering outside Routes */}
                {auth.loggedIn === false && (
                    <div className="row">
                        <div className="col-md-2 offset-md-5">
                            <LoginForm/>
                        </div>
                    </div>
                )}
                {auth.isDispo && <JournalEditor/>}
                <TransportForm/>
                <TodoForm/>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </MobxRouter>
    </Provider>
);

export default Container;
