import React from "react";
import {render} from "react-dom";
import {AppContainer} from "react-hot-loader";
import Container from "./Container.jsx";
import ResourceListStore from "./stores/resources";
import ResourceAdminStore from "./stores/resourceAdmin";
import moment from "moment";
import LogStore from "./stores/log";
import MobxReactFormDevTools from 'mobx-react-form-devtools';
import './styles/global.css';

const store = {
    resources: new ResourceListStore(),
    resourceAdmin: new ResourceAdminStore(),
    log: new LogStore()
};

MobxReactFormDevTools.register({resourceEditor: store.resources.form, resourceAdmin: store.resourceAdmin.form});

function renderApp(AppComponent) {
    render(
        <AppContainer>
            <AppComponent store={store}/>
        </AppContainer>,
        document.getElementById('root'));
}

renderApp(Container);
store.resources.init();
store.resourceAdmin.init();
moment.locale('de');

if (module.hot) {
    module.hot.accept(() => renderApp(Container));
}

