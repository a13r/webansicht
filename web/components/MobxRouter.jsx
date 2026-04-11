import React from "react";
import {Router} from "react-router";
import {observer} from "mobx-react";

const MobxRouter = observer(({store, children}) => {
    return (
        <Router location={store.location} navigator={store.history}>{children}</Router>
    )
});

export default MobxRouter;
