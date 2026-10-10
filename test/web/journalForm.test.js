import {describe, expect, it, vi} from 'vitest';

vi.mock('~/app', () => ({journal: {on: vi.fn(), find: vi.fn(), patch: vi.fn(), create: vi.fn()}}));
vi.mock('~/stores', () => ({loginReaction: vi.fn(), notification: {success: vi.fn()}}));

const {default: JournalStore} = await import('~/stores/journal');

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
