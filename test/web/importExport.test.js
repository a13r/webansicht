import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('whatwg-fetch', () => ({}));
vi.mock('~/stores', () => ({
    auth: {accessToken: 'token'},
    notification: {success: vi.fn(), error: vi.fn()}
}));

const {notification} = await import('~/stores');
const {default: ImportExportStore} = await import('~/stores/importExport');

describe('ImportExportStore.sendFile', () => {
    let store;

    beforeEach(() => {
        vi.clearAllMocks();
        store = new ImportExportStore();
        store.importFile = new Blob(['x']);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows a success toast on 200', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({status: 200}));
        await store.sendFile();
        expect(notification.success).toHaveBeenCalledWith('Datenbank wurde importiert');
        expect(notification.error).not.toHaveBeenCalled();
    });

    it('shows the server message on error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            status: 500,
            json: () => Promise.resolve({message: 'Invalid backup'})
        }));
        await store.sendFile();
        expect(notification.error).toHaveBeenCalledWith('Invalid backup');
        expect(notification.success).not.toHaveBeenCalled();
    });

    it('falls back to status text when body is not JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            status: 413,
            statusText: 'Payload Too Large',
            json: () => Promise.reject(new Error('bad json'))
        }));
        await store.sendFile();
        expect(notification.error).toHaveBeenCalledWith('Payload Too Large');
    });

    it('shows an error on network failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));
        await store.sendFile();
        expect(notification.error).toHaveBeenCalledWith('Failed to fetch');
    });
});
