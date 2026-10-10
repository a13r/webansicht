import {beforeEach, describe, expect, it, vi} from 'vitest';

const {services, authMock, notificationMock, loginReaction} = vi.hoisted(() => {
    const service = () => ({on: vi.fn(), off: vi.fn(), find: vi.fn(), patch: vi.fn(), create: vi.fn(), remove: vi.fn()});
    return {
        services: {
            resources: service(),
            stations: service(),
            transports: service(),
            journal: service(),
            todos: service(),
            messages: service(),
        },
        authMock: {isAdmin: false, isDispo: false, user: {_id: 'me', name: 'Me', stationId: undefined}},
        notificationMock: {success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()},
        loginReaction: vi.fn(),
    };
});

vi.mock('~/app', () => services);
vi.mock('~/stores', () => ({auth: authMock, notification: notificationMock, loginReaction}));

// the suite runs with isolate: false; drop modules cached by other files (bound to their mocks)
vi.resetModules();
const {default: ResourceStore} = await import('~/stores/resources');
const {default: StationStore, Station} = await import('~/stores/stations');
const {TransportStore} = await import('~/stores/transports');
const {default: JournalStore} = await import('~/stores/journal');
const {TodoStore} = await import('~/stores/todos');
const {MessageStore} = await import('~/stores/messages');

const ids = list => list.map(e => e._id);

beforeEach(() => {
    vi.clearAllMocks();
    Object.values(services).forEach(s => s.find.mockResolvedValue([]));
    Object.assign(authMock, {isAdmin: false, isDispo: false, user: {_id: 'me', name: 'Me', stationId: undefined}});
});

describe('ResourceStore events', () => {
    let store;

    beforeEach(() => {
        store = new ResourceStore({_id: {label: 'ID'}, callSign: {}, hidden: {}});
        store.list = [
            {_id: 'a', callSign: 'B', ordering: 2, hidden: false},
            {_id: 'b', callSign: 'A', ordering: 3, hidden: false},
        ];
    });

    it('subscribes to all service events', () => {
        const events = services.resources.on.mock.calls.map(c => c[0]);
        expect(events).toEqual(expect.arrayContaining(['created', 'updated', 'patched', 'removed']));
    });

    it('onCreated inserts and sorts by ordering, then callSign', () => {
        store.onCreated({_id: 'c', callSign: 'C', ordering: 1, hidden: false});
        store.onCreated({_id: 'd', callSign: 'A', ordering: 2, hidden: false});
        expect(ids(store.list)).toEqual(['c', 'd', 'a', 'b']);
    });

    it('onUpdated merges into the existing entry and re-sorts', () => {
        store.onUpdated({_id: 'b', callSign: 'A', ordering: 1, hidden: false, state: 3});
        expect(ids(store.list)).toEqual(['b', 'a']);
        expect(store.list[0].state).toBe(3);
        expect(services.resources.find).not.toHaveBeenCalled();
    });

    it('onUpdated reloads when the hidden flag changes', () => {
        store.onUpdated({_id: 'a', callSign: 'B', ordering: 2, hidden: true});
        expect(services.resources.find).toHaveBeenCalledTimes(1);
    });

    it('onUpdated reloads for an unknown entry', () => {
        store.onUpdated({_id: 'zzz', callSign: 'Z', ordering: 9, hidden: false});
        expect(services.resources.find).toHaveBeenCalledTimes(1);
    });

    it('onUpdated refreshes the form if the entry is selected', () => {
        store.form.update({_id: 'a', callSign: 'B'});
        store.onUpdated({_id: 'a', callSign: 'B2', ordering: 2, hidden: false});
        expect(store.form.$('callSign').value).toBe('B2');
    });

    it('onUpdated leaves the form alone for other entries', () => {
        store.form.update({_id: 'a', callSign: 'B'});
        store.onUpdated({_id: 'b', callSign: 'A2', ordering: 3, hidden: false});
        expect(store.form.$('callSign').value).toBe('B');
    });

    it('onRemoved drops the entry', () => {
        store.onRemoved({_id: 'a'});
        expect(ids(store.list)).toEqual(['b']);
    });
});

describe('StationStore events', () => {
    let store;

    beforeEach(() => {
        store = new StationStore();
        store.list = [
            new Station({_id: 'a', name: 'Alpha', ordering: 1, currentPatients: 0, maxPatients: 5}),
            new Station({_id: 'b', name: 'Beta', ordering: 2, currentPatients: 0, maxPatients: 5}),
        ];
    });

    it('onCreated updates an already known station instead of duplicating it', () => {
        store.onCreated({_id: 'a', name: 'Alpha neu', ordering: 1, currentPatients: 2, maxPatients: 5});
        expect(store.list).toHaveLength(2);
        expect(store.list[0].name).toBe('Alpha neu');
        expect(store.list[0].currentPatients).toBe(2);
    });

    it('onCreated adds an unknown station in sorted position', () => {
        store.onCreated({_id: 'c', name: 'Gamma', ordering: 0, currentPatients: 0, maxPatients: 1});
        expect(ids(store.list)).toEqual(['c', 'a', 'b']);
        expect(store.list[0]).toBeInstanceOf(Station);
    });

    it('onCreated sorts by name when the ordering is equal', () => {
        store.onCreated({_id: 'c', name: 'Aaa', ordering: 1, currentPatients: 0, maxPatients: 1});
        expect(ids(store.list)).toEqual(['c', 'a', 'b']);
    });

    describe('reconciliation with a locally created, not yet saved station', () => {
        let pending;

        beforeEach(() => {
            store.create();
            pending = store.list.find(s => !s._id);
        });

        it('adopts the _id of the server entry instead of adding a duplicate', () => {
            expect(pending.isNew).toBe(true);
            store.onCreated({_id: 'n', name: 'Neu', ordering: 3, currentPatients: 0, maxPatients: 4});
            expect(store.list).toHaveLength(3);
            const adopted = store.list.find(s => s._id === 'n');
            expect(adopted).toBe(pending);
            expect(adopted.isNew).toBe(false);
            expect(adopted.name).toBe('Neu');
            expect(adopted.maxPatients).toBe(4);
        });

        it('does not touch the pending station when the event is for a known one', () => {
            store.onCreated({_id: 'a', name: 'Alpha', ordering: 1, currentPatients: 1, maxPatients: 5});
            expect(pending.isNew).toBe(true);
            expect(store.list).toHaveLength(3);
        });

        it('only the first of several pending stations is adopted', () => {
            store.create();
            store.onCreated({_id: 'n', name: 'Neu', ordering: 3, currentPatients: 0, maxPatients: 4});
            expect(store.list.filter(s => s.isNew)).toHaveLength(1);
            expect(store.list).toHaveLength(4);
        });
    });

    it('onUpdated merges changes and re-sorts', () => {
        store.onUpdated({_id: 'b', name: 'Beta', ordering: 0});
        expect(ids(store.list)).toEqual(['b', 'a']);
    });

    it('onUpdated removes a station that was hidden while deleted ones are not shown', () => {
        store.onUpdated({_id: 'a', name: 'Alpha', ordering: 1, deleted: true});
        expect(ids(store.list)).toEqual(['b']);
    });

    it('onUpdated keeps a hidden station while deleted ones are shown', () => {
        store.showDeleted = true;
        store.onUpdated({_id: 'a', name: 'Alpha', ordering: 1, deleted: true});
        expect(ids(store.list)).toEqual(['a', 'b']);
        expect(store.list[0].deleted).toBe(true);
    });

    it('onUpdated reloads for an unknown station', () => {
        store.onUpdated({_id: 'zzz', name: 'Z', ordering: 1});
        expect(services.stations.find).toHaveBeenCalledTimes(1);
    });

    it('onRemoved drops the station', () => {
        store.onRemoved({_id: 'a'});
        expect(ids(store.list)).toEqual(['b']);
    });
});

describe('TransportStore events', () => {
    let store;

    beforeEach(() => {
        store = new TransportStore();
        store.list = [
            {_id: 'a', createdAt: '2025-01-01T10:00:00Z', state: 0, userId: 'me'},
            {_id: 'b', createdAt: '2025-01-01T12:00:00Z', state: 1, userId: 'other'},
        ];
    });

    it('onCreated inserts ordered by createdAt', () => {
        store.onCreated({_id: 'c', createdAt: '2025-01-01T11:00:00Z', state: 0});
        expect(ids(store.list)).toEqual(['a', 'c', 'b']);
    });

    it('onUpdated merges into the existing entry', () => {
        store.onUpdated({_id: 'a', state: 2, resourceId: 'r'});
        expect(store.list[0]).toMatchObject({_id: 'a', state: 2, resourceId: 'r', userId: 'me'});
        expect(services.transports.find).not.toHaveBeenCalled();
    });

    it('onUpdated reloads for an unknown entry', () => {
        store.onUpdated({_id: 'zzz'});
        expect(services.transports.find).toHaveBeenCalledTimes(1);
    });

    it('onRemoved drops the entry', () => {
        store.onRemoved({_id: 'a'});
        expect(ids(store.list)).toEqual(['b']);
    });

    it('existNewTransports is true only while a transport is in state 0', () => {
        expect(store.existNewTransports).toBe(true);
        store.onUpdated({_id: 'a', state: 1});
        expect(store.existNewTransports).toBe(false);
    });

    it('openTransports lists unfinished transports of a resource', () => {
        store.list = [
            {_id: 'a', resourceId: 'r', state: 2},
            {_id: 'b', resourceId: 'r', state: 3},
            {_id: 'c', resourceId: 'x', state: 0},
        ];
        expect(ids(store.openTransports({_id: 'r'}))).toEqual(['a']);
    });

    describe('editAllowed', () => {
        it('allows dispatchers to edit any transport', () => {
            authMock.isDispo = true;
            expect(store.editAllowed({userId: 'other'})).toBe(true);
        });

        it('allows other users to edit their own transports', () => {
            expect(store.editAllowed({userId: 'me'})).toBe(true);
        });

        it('denies other users to edit foreign transports', () => {
            expect(store.editAllowed({userId: 'other'})).toBe(false);
        });

        it('edit() opens the form for allowed transports', () => {
            store.edit(store.list[0])();
            expect(store.form.isVisible).toBe(true);
            expect(store.form.$('_id').value).toBe('a');
            expect(notificationMock.error).not.toHaveBeenCalled();
        });

        it('edit() shows an error and keeps the form closed for foreign transports', () => {
            store.edit(store.list[1])();
            expect(store.form.isVisible).not.toBe(true);
            expect(notificationMock.error).toHaveBeenCalledWith(
                'Dieser Transport kann nicht bearbeitet werden', 'Fremder Transport');
        });
    });

    describe('login handling', () => {
        it('registers the new-transport notification only once for dispatchers', () => {
            const [login, logout] = loginReaction.mock.calls.at(-1);
            services.transports.on.mockClear();
            login({auth: {isDispo: true}});
            login({auth: {isDispo: true}});
            const registered = services.transports.on.mock.calls.filter(c => c[0] === 'created' && c[1] === store.showNotification);
            const removed = services.transports.off.mock.calls.filter(c => c[0] === 'created' && c[1] === store.showNotification);
            expect(registered).toHaveLength(2);
            expect(removed).toHaveLength(2); // every login unregisters first
            logout();
            expect(services.transports.off).toHaveBeenLastCalledWith('created', store.showNotification);
        });

        it('does not register the notification for non-dispatchers', () => {
            const [login] = loginReaction.mock.calls.at(-1);
            services.transports.on.mockClear();
            login({auth: {isDispo: false}});
            expect(services.transports.on).not.toHaveBeenCalled();
        });
    });
});

describe('JournalStore events', () => {
    let store;

    beforeEach(() => {
        store = new JournalStore();
        store.list = [
            {_id: 'b', createdAt: '2025-01-01T12:00:00Z', text: 'b'},
            {_id: 'a', createdAt: '2025-01-01T10:00:00Z', text: 'a'},
        ];
    });

    it('onCreated keeps newest-first order by default', () => {
        store.onCreated({_id: 'c', createdAt: '2025-01-01T11:00:00Z'});
        expect(ids(store.list)).toEqual(['b', 'c', 'a']);
    });

    it('onCreated keeps oldest-first order when sorted ascending', () => {
        store.query.$sort.createdAt = 1;
        store.list = [...store.list].reverse();
        store.onCreated({_id: 'c', createdAt: '2025-01-01T11:00:00Z'});
        expect(ids(store.list)).toEqual(['a', 'c', 'b']);
    });

    it('onUpdated merges when createdAt is unchanged', () => {
        store.onUpdated({_id: 'a', createdAt: '2025-01-01T10:00:00Z', text: 'neu'});
        expect(store.list[1].text).toBe('neu');
        expect(services.journal.find).not.toHaveBeenCalled();
    });

    it('onUpdated reloads when createdAt changed (order may change)', () => {
        store.onUpdated({_id: 'a', createdAt: '2025-01-01T13:00:00Z', text: 'a'});
        expect(services.journal.find).toHaveBeenCalledTimes(1);
    });

    it('onUpdated reloads for an unknown entry', () => {
        store.onUpdated({_id: 'zzz', createdAt: '2025-01-01T13:00:00Z'});
        expect(services.journal.find).toHaveBeenCalledTimes(1);
    });

    it('onUpdated refreshes the editor form for the selected entry only', () => {
        store.form.update({_id: 'a', text: 'a', createdAt: '01.01.2025 11:00'});
        store.onUpdated({_id: 'b', createdAt: '2025-01-01T12:00:00Z', text: 'andere'});
        expect(store.form.$('text').value).toBe('a');
        store.onUpdated({_id: 'a', createdAt: '2025-01-01T10:00:00Z', text: 'live'});
        expect(store.form.$('text').value).toBe('live');
    });

    it('onRemoved drops the entry', () => {
        store.onRemoved({_id: 'a'});
        expect(ids(store.list)).toEqual(['b']);
    });
});

describe.each([
    ['TodoStore', () => new TodoStore(), 'todos', 'dueDate'],
    ['MessageStore', () => new MessageStore(), 'messages', null],
])('%s events', (name, create, serviceName, sortKey) => {
    let store;
    let service;

    beforeEach(() => {
        service = services[serviceName];
        store = create();
        store.list = sortKey
            ? [{_id: 'a', dueDate: '2025-01-01T10:00:00Z'}, {_id: 'b', dueDate: '2025-01-01T12:00:00Z'}]
            : [{_id: 'a', text: 'a'}, {_id: 'b', text: 'b'}];
    });

    it('onUpdated merges into the existing entry', () => {
        store.onUpdated({_id: 'a', done: true});
        expect(store.list.find(e => e._id === 'a').done).toBe(true);
        expect(service.find).not.toHaveBeenCalled();
    });

    it('onUpdated reloads for an unknown entry', () => {
        store.onUpdated({_id: 'zzz'});
        expect(service.find).toHaveBeenCalledTimes(1);
    });

    it('onRemoved drops the entry', () => {
        store.onRemoved({_id: 'a'});
        expect(ids(store.list)).toEqual(['b']);
    });

    it('listeners are registered once per login and removed on logout', () => {
        const [login, logout] = loginReaction.mock.calls.at(-1);
        service.on.mockClear();
        service.off.mockClear();
        login({auth: {isDispo: true}});
        expect(service.on.mock.calls.map(c => c[0]).sort()).toEqual(['created', 'patched', 'removed', 'updated']);
        expect(service.find).toHaveBeenCalledTimes(1);
        logout();
        expect(service.off.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining(['created', 'updated', 'patched', 'removed']));
    });

    it('does not load or listen for non-dispatchers', () => {
        const [login] = loginReaction.mock.calls.at(-1);
        service.on.mockClear();
        service.find.mockClear();
        login({auth: {isDispo: false}});
        expect(service.on).not.toHaveBeenCalled();
        expect(service.find).not.toHaveBeenCalled();
    });
});

describe('TodoStore ordering', () => {
    it('onCreated and onUpdated keep the list sorted by dueDate', () => {
        const store = new TodoStore();
        store.list = [{_id: 'a', dueDate: '2025-01-01T10:00:00Z'}, {_id: 'b', dueDate: '2025-01-01T12:00:00Z'}];
        store.onCreated({_id: 'c', dueDate: '2025-01-01T11:00:00Z'});
        expect(ids(store.list)).toEqual(['a', 'c', 'b']);
        store.onUpdated({_id: 'a', dueDate: '2025-01-01T13:00:00Z'});
        expect(ids(store.list)).toEqual(['c', 'b', 'a']);
    });
});

describe('MessageStore ordering', () => {
    it('onCreated puts the newest message first', () => {
        const store = new MessageStore();
        store.list = [{_id: 'a'}];
        store.onCreated({_id: 'b'});
        expect(ids(store.list)).toEqual(['b', 'a']);
    });
});
