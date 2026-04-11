import React from "react";
import {createRoot} from "react-dom/client";
import Container from "./Container.jsx";
import moment from "moment";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./styles/global.css";

const container = document.getElementById('root');
const root = createRoot(container);

function renderApp(AppComponent) {
    root.render(
        <AppComponent/>
    );
}

moment.locale('de');
renderApp(Container);
