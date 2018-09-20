import React from 'react';
import {Fade, Loop} from 'react-animation-components';

export const NewTransportWarning = () =>
    <Loop in>
        <Fade style={{display: 'inline'}}><i className="fa fa-lg fa-ambulance text-danger"/></Fade>
    </Loop>;
