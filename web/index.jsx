import React from "react";
import {render} from "react-dom";
import {AppContainer} from "react-hot-loader";
import Container from "./Container.jsx";
import moment from "moment";

function renderApp(AppComponent) {
    render(
        <AppContainer>
            <AppComponent/>
        </AppContainer>,
        document.getElementById('root'));
}

moment.locale('de');
renderApp(Container);

if (module.hot) {
    module.hot.accept(() => renderApp(Container));
}

