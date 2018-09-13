import React from 'react';
import {Fade, Loop} from 'react-animation-components';

export const NewTransportWarning = () =>
    <Loop in>
        <Fade><i className="fa fa-lg fa-ambulance text-danger"/></Fade>
    </Loop>;
