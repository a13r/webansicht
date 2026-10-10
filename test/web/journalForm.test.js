import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const journal = vi.hoisted(() => ({on: vi.fn(), find: vi.fn(), patch: vi.fn(), create: vi.fn()}));
vi.mock('~/app', () => ({journal}));
vi.mock('~/stores', () => ({loginReaction: vi.fn(), notification: {success: vi.fn()}}));

// The suite runs with isolate: false; load a fresh copy of the store that uses the mocks above
vi.resetModules();
const {default: JournalStore} = await import('~/stores/journal');
const {default: moment} = await import('~/moment');

describe('journal form validation', () => {
    it('is valid with the default timestamp', async () => {
        const {form} = new JournalStore();
        await form.validate();
        expect(form.isValid).toBe(true);
    });

    it('is invalid with a malformed timestamp', async () => {
        const {form} = new JournalStore();
        form.$('createdAt').set('foo');
        await form.validate();
        expect(form.isValid).toBe(false);
        expect(form.$('createdAt').hasError).toBe(true);
    });

    it('is invalid with an empty timestamp', async () => {
        const {form} = new JournalStore();
        form.$('createdAt').set('');
        await form.validate();
        expect(form.isValid).toBe(false);
    });
});

describe('editing a journal entry', () => {
    const stored = {_id: 'e1', text: 'Lagemeldung', createdAt: '2026-10-10T08:15:42.123Z', state: 'offen'};
    let store;

    beforeEach(() => {
        // selectEntry focuses the text input after a timeout; there is no DOM here
        vi.useFakeTimers();
        journal.patch.mockReset().mockReturnValue(new Promise(() => {}));
        store = new JournalStore();
        store.list = [stored];
        store.selectEntry('e1');
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('keeps the stored timestamp, including seconds, when it was not changed', () => {
        store.form.$('text').set('Lagemeldung ergänzt');
        store.onSuccess(store.form);

        expect(journal.patch).toHaveBeenCalledTimes(1);
        const [id, data] = journal.patch.mock.calls[0];
        expect(id).toBe('e1');
        expect(data.text).toBe('Lagemeldung ergänzt');
        expect(data).not.toHaveProperty('createdAt');
    });

    it('sends the new timestamp when it was changed', () => {
        const changed = moment(stored.createdAt).add(5, 'minutes').format('L LT');
        store.form.$('createdAt').set(changed);
        store.onSuccess(store.form);

        const [, data] = journal.patch.mock.calls[0];
        expect(data.createdAt).toBe(moment(changed, 'L LT').toISOString());
    });
});
