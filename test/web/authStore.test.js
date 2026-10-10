import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {clientMock, routerMock, clearForms} = vi.hoisted(() => ({
    clientMock: {on: vi.fn(), authenticate: vi.fn(), reAuthenticate: vi.fn(), logout: vi.fn()},
    routerMock: {location: {pathname: '/'}, push: vi.fn()},
    clearForms: vi.fn(),
}));

vi.mock('~/app', () => ({client: clientMock, service: vi.fn()}));
vi.mock('~/stores', () => ({
    router: routerMock,
    auth: {login: vi.fn()},
    notification: {success: vi.fn(), error: vi.fn()},
}));
vi.mock('~/forms', () => ({clearForms}));

// the suite runs with isolate: false; drop modules cached by other files (bound to their mocks)
vi.resetModules();
const {default: AuthStore} = await import('~/stores/auth');

const flush = () => new Promise(resolve => setImmediate(resolve));
const user = {_id: 'u1', username: 'dispo', roles: ['dispo']};

function memoryStorage() {
    const data = new Map();
    return {
        getItem: k => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
        removeItem: k => data.delete(k),
    };
}

// answers GET /sso-token with the given body (or fails when body is an Error)
function stubSsoToken(body) {
    const fetchMock = vi.fn(() => body instanceof Error
        ? Promise.reject(body)
        : Promise.resolve({json: () => Promise.resolve(body)}));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('AuthStore', () => {
    let storage;
    let store;

    // builds a store whose initial reAuthenticate (run by the constructor) has settled as logged out
    async function createStore() {
        clientMock.reAuthenticate.mockRejectedValue(new Error('not authenticated'));
        stubSsoToken({sso: false});
        const s = new AuthStore();
        await flush();
        vi.clearAllMocks();
        return s;
    }

    beforeEach(async () => {
        storage = memoryStorage();
        vi.stubGlobal('sessionStorage', storage);
        vi.spyOn(console, 'error').mockImplementation(() => {});
        routerMock.location.pathname = '/';
        store = await createStore();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('initial state', () => {
        it('is logged out without a valid session or SSO', () => {
            expect(store.loggedIn).toBe(false);
            expect(store.user).toBeNull();
            expect(store.ssoAvailable).toBe(false);
        });

        it('derives roles from the user', () => {
            expect(store.isDispo).toBeFalsy();
            store.userLoggedIn('t', {roles: ['dispo', 'transports']});
            expect(store.isDispo).toBe(true);
            expect(store.hasTransports).toBe(true);
            expect(store.isAdmin).toBe(false);
            expect(store.isStation).toBe(false);
        });
    });

    describe('reAuthenticate', () => {
        it('logs in with a valid stored session and probes SSO availability', async () => {
            clientMock.reAuthenticate.mockResolvedValue({accessToken: 'tok', user});
            const fetchMock = stubSsoToken({accessToken: 'sso'});
            await store.reAuthenticate();
            await flush();
            expect(store.loggedIn).toBe(true);
            expect(store.user).toEqual(user);
            expect(store.accessToken).toBe('tok');
            expect(fetchMock).toHaveBeenCalledWith('/sso-token');
            expect(store.ssoAvailable).toBe(true);
            expect(clientMock.authenticate).not.toHaveBeenCalled();
        });

        it('keeps ssoAvailable false for a valid session when SSO yields no token', async () => {
            clientMock.reAuthenticate.mockResolvedValue({accessToken: 'tok', user});
            stubSsoToken({sso: false});
            await store.reAuthenticate();
            await flush();
            expect(store.loggedIn).toBe(true);
            expect(store.ssoAvailable).toBe(false);
        });

        it('falls back to SSO login when there is no session', async () => {
            clientMock.reAuthenticate.mockRejectedValue(new Error('no session'));
            stubSsoToken({accessToken: 'sso'});
            clientMock.authenticate.mockResolvedValue({accessToken: 'jwt', user});
            await store.reAuthenticate();
            expect(clientMock.authenticate).toHaveBeenCalledWith({strategy: 'jwt', accessToken: 'sso'});
            expect(store.ssoAvailable).toBe(true);
            expect(store.loggedIn).toBe(true);
            expect(store.user).toEqual(user);
        });

        it('does not use SSO after an explicit logout (sso-disabled) but still reports it as available', async () => {
            storage.setItem('sso-disabled', '1');
            clientMock.reAuthenticate.mockRejectedValue(new Error('no session'));
            stubSsoToken({accessToken: 'sso'});
            await store.reAuthenticate();
            expect(clientMock.authenticate).not.toHaveBeenCalled();
            expect(store.ssoAvailable).toBe(true);
            expect(store.loggedIn).toBe(false);
        });

        it('stays logged out when the SSO user does not exist locally', async () => {
            clientMock.reAuthenticate.mockRejectedValue(new Error('no session'));
            stubSsoToken({accessToken: 'sso'});
            clientMock.authenticate.mockRejectedValue(new Error('unknown user'));
            await store.reAuthenticate();
            expect(store.loggedIn).toBe(false);
            expect(store.user).toBeNull();
            expect(store.ssoAvailable).toBe(true);
        });

        it('stays logged out when the SSO endpoint is unreachable', async () => {
            clientMock.reAuthenticate.mockRejectedValue(new Error('no session'));
            stubSsoToken(new Error('network down'));
            await store.reAuthenticate();
            expect(clientMock.authenticate).not.toHaveBeenCalled();
            expect(store.ssoAvailable).toBe(false);
            expect(store.loggedIn).toBe(false);
        });
    });

    describe('login', () => {
        it('authenticates locally, stores the user and clears sso-disabled', async () => {
            storage.setItem('sso-disabled', '1');
            clientMock.authenticate.mockResolvedValue({accessToken: 'tok', user});
            const result = await store.login({username: 'dispo', password: 'pw'});
            expect(clientMock.authenticate).toHaveBeenCalledWith({strategy: 'local', username: 'dispo', password: 'pw'});
            expect(result).toEqual({user});
            expect(store.loggedIn).toBe(true);
            expect(store.user).toEqual(user);
            expect(storage.getItem('sso-disabled')).toBeNull();
        });

        it('logs out and rethrows when the credentials are wrong', async () => {
            store.userLoggedIn('tok', user);
            const error = new Error('Invalid login');
            clientMock.authenticate.mockRejectedValue(error);
            await expect(store.login({username: 'x', password: 'y'})).rejects.toBe(error);
            expect(store.loggedIn).toBe(false);
            expect(store.user).toBeNull();
            expect(store.accessToken).toBeNull();
        });
    });

    describe('loginSSO', () => {
        it('clears sso-disabled and logs in with the SSO token', async () => {
            storage.setItem('sso-disabled', '1');
            stubSsoToken({accessToken: 'sso'});
            clientMock.authenticate.mockResolvedValue({accessToken: 'jwt', user});
            await store.loginSSO();
            expect(storage.getItem('sso-disabled')).toBeNull();
            expect(clientMock.authenticate).toHaveBeenCalledWith({strategy: 'jwt', accessToken: 'sso'});
            expect(store.loggedIn).toBe(true);
        });

        it('does nothing further when there is no SSO token', async () => {
            stubSsoToken({sso: false});
            await store.loginSSO();
            expect(clientMock.authenticate).not.toHaveBeenCalled();
            expect(store.loggedIn).toBe(false);
        });

        it('propagates a failing SSO authentication', async () => {
            stubSsoToken({accessToken: 'sso'});
            clientMock.authenticate.mockRejectedValue(new Error('forbidden'));
            await expect(store.loginSSO()).rejects.toThrow('forbidden');
        });
    });

    describe('logout', () => {
        beforeEach(() => {
            store.userLoggedIn('tok', user);
        });

        it('clears the session, forms and disables automatic SSO login', async () => {
            clientMock.logout.mockResolvedValue();
            await store.logout();
            expect(clearForms).toHaveBeenCalled();
            expect(storage.getItem('sso-disabled')).toBe('1');
            expect(store.loggedIn).toBe(false);
            expect(store.user).toBeNull();
            expect(store.accessToken).toBeNull();
        });

        it('navigates to the start page only when elsewhere', async () => {
            clientMock.logout.mockResolvedValue();
            await store.logout();
            expect(routerMock.push).not.toHaveBeenCalled();
            routerMock.location.pathname = '/journal';
            await store.logout();
            expect(routerMock.push).toHaveBeenCalledWith('/');
        });

        it('keeps the session state when the server call fails', async () => {
            clientMock.logout.mockRejectedValue(new Error('offline'));
            await store.logout();
            expect(console.error).toHaveBeenCalled();
            expect(store.loggedIn).toBe(true);
            expect(storage.getItem('sso-disabled')).toBeNull();
        });
    });

    describe('re-authentication error (token expired while connected)', () => {
        it('logs the user out when the client emits reauthentication-error', async () => {
            clientMock.reAuthenticate.mockRejectedValue(new Error('no session'));
            stubSsoToken({sso: false});
            const s = new AuthStore();
            await flush();
            const handler = clientMock.on.mock.calls.find(c => c[0] === 'reauthentication-error')[1];
            s.userLoggedIn('tok', user);
            expect(s.loggedIn).toBe(true);
            handler(new Error('jwt expired'));
            expect(s.loggedIn).toBe(false);
            expect(s.user).toBeNull();
            expect(console.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
        });
    });
});
