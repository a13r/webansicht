import {describe, it, expect, vi, beforeEach} from 'vitest';

const {resourcesMock, notificationMock} = vi.hoisted(() => ({
    resourcesMock: {on: vi.fn(), create: vi.fn(), patch: vi.fn(), find: vi.fn()},
    notificationMock: {success: vi.fn(), error: vi.fn()},
}));

vi.mock('~/app', () => ({resources: resourcesMock}));
vi.mock('~/stores/index', () => ({
    notification: notificationMock,
    loginReaction: vi.fn(),
}));
vi.mock('~/forms/deleteResourceForm', () => ({DeleteResourceForm: class {}}));

const {default: ResourceAdminStore} = await import('~/stores/resourceAdmin');

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('ResourceAdminStore create', () => {
    let store;

    beforeEach(() => {
        vi.clearAllMocks();
        store = new ResourceAdminStore();
        store.form.$('callSign').set('KTW 1');
        store.form.$('type').set('KTW');
        store.form.$('ordering').set(5);
    });

    it('keeps the input and shows an error when creating fails', async () => {
        resourcesMock.create.mockRejectedValue(new Error('Server kaputt'));

        store.onSuccess(store.form);
        await flush();

        expect(notificationMock.error).toHaveBeenCalledWith('Server kaputt', 'Fehler beim Speichern');
        expect(notificationMock.success).not.toHaveBeenCalled();
        expect(store.form.$('callSign').value).toBe('KTW 1');
        expect(store.form.$('type').value).toBe('KTW');
    });

    it('does not reset the form before the request has finished', () => {
        resourcesMock.create.mockReturnValue(new Promise(() => {}));

        store.onSuccess(store.form);

        expect(store.form.$('callSign').value).toBe('KTW 1');
    });

    it('resets the form and shows success once created', async () => {
        resourcesMock.create.mockResolvedValue({callSign: 'KTW 1'});

        store.onSuccess(store.form);
        await flush();

        expect(notificationMock.success).toHaveBeenCalledWith('Die Ressource KTW 1 wurde erstellt');
        expect(notificationMock.error).not.toHaveBeenCalled();
        expect(store.form.$('callSign').value).toBe('');
        expect(store.editorVisible).toBe(true);
    });
});
