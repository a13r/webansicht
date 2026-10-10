import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, it, expect, beforeEach, vi} from 'vitest';

const {auth} = vi.hoisted(() => ({auth: {user: null, loggedIn: false}}));

vi.mock('~/stores', () => ({auth}));

import restrictToRoles from '~/components/restrictToRoles';
import authenticate from '~/components/authenticate';

const Inner = ({label, children}) =>
    React.createElement('p', null, label, ':', children);

const renderWith = (Wrapped) => renderToStaticMarkup(
    React.createElement(Wrapped, {label: 'hello'}, React.createElement('b', null, 'kid'))
);

describe('HOC prop forwarding', () => {
    beforeEach(() => {
        auth.user = null;
        auth.loggedIn = false;
    });

    describe('restrictToRoles', () => {
        const Wrapped = restrictToRoles(['dispo'])(Inner);

        it('passes props and children to the wrapped component', () => {
            auth.user = {roles: ['dispo']};
            expect(renderWith(Wrapped)).toBe('<p>hello:<b>kid</b></p>');
        });

        it('renders nothing for a user without the role', () => {
            auth.user = {roles: ['station']};
            expect(renderWith(Wrapped)).toBe('');
        });

        it('renders nothing when logged out', () => {
            expect(renderWith(Wrapped)).toBe('');
        });
    });

    describe('authenticate', () => {
        const Wrapped = authenticate(Inner);

        it('passes props and children to the wrapped component', () => {
            auth.loggedIn = true;
            expect(renderWith(Wrapped)).toBe('<p>hello:<b>kid</b></p>');
        });

        it('renders nothing when logged out', () => {
            expect(renderWith(Wrapped)).toBe('');
        });
    });
});
