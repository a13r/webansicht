import React from 'react';
import {render} from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Container from './Container.jsx';
import ResourceListStore from './stores/resources';
import ResourceAdminStore from './stores/resourceAdmin';
import moment from 'moment';

const store = {
    resources: new ResourceListStore(),
    resourceAdmin: new ResourceAdminStore()
};

function renderApp(AppComponent) {
    render(
        <AppContainer>
            <AppComponent store={store}/>
        </AppContainer>,
        document.getElementById('root'));
}

renderApp(Container);
store.resources.init();
moment.locale('de');

if (module.hot) {
    module.hot.accept(() => renderApp(Container));
}

