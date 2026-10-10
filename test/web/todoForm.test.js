import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {todosMock, notificationMock} = vi.hoisted(() => ({
    todosMock: {create: vi.fn(), patch: vi.fn(), remove: vi.fn()},
    notificationMock: {success: vi.fn(), error: vi.fn()},
}));

vi.mock('~/app', () => ({todos: todosMock}));
vi.mock('~/stores', () => ({notification: notificationMock}));

// the suite runs with isolate: false; drop modules cached by other files (bound to their mocks)
vi.resetModules();
const {TodoForm} = await import('~/forms/todoForm');
const {default: moment} = await import('~/moment');

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('TodoForm time maths', () => {
    let form;

    beforeEach(() => {
        vi.clearAllMocks();
        form = new TodoForm();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('setNow fills the due date with the current time', () => {
        vi.useFakeTimers({toFake: ['Date']});
        vi.setSystemTime(new Date(2025, 11, 24, 18, 37, 45));
        form.setNow();
        expect(form.$('dueDate').value).toBe('24.12.2025 18:37');
    });

    it('trimMinutes resets the minutes and keeps the hour', () => {
        form.set({dueDate: '24.12.2025 18:37'});
        form.trimMinutes();
        expect(form.$('dueDate').value).toBe('24.12.2025 18:00');
    });

    it('addMinutes adds minutes', () => {
        form.set({dueDate: '24.12.2025 18:37'});
        form.addMinutes(10)();
        expect(form.$('dueDate').value).toBe('24.12.2025 18:47');
    });

    it('addMinutes rolls over the hour and the day', () => {
        form.set({dueDate: '24.12.2025 23:50'});
        form.addMinutes(15)();
        expect(form.$('dueDate').value).toBe('25.12.2025 00:05');
    });

    it('addMinutes subtracts with a negative value', () => {
        form.set({dueDate: '01.01.2026 00:05'});
        form.addMinutes(-10)();
        expect(form.$('dueDate').value).toBe('31.12.2025 23:55');
    });

    it('addMinutes accumulates over repeated calls', () => {
        form.set({dueDate: '24.12.2025 18:00'});
        form.addMinutes(30)();
        form.addMinutes(30)();
        expect(form.$('dueDate').value).toBe('24.12.2025 19:00');
    });
});

describe('TodoForm submit', () => {
    let form;

    beforeEach(() => {
        vi.clearAllMocks();
        form = new TodoForm();
    });

    it('creates a new todo with an ISO due date and without _id', async () => {
        todosMock.create.mockResolvedValue({});
        form.set({description: 'Funkgeräte laden', dueDate: '24.12.2025 18:30'});
        form.submit();
        await flush();
        expect(todosMock.create).toHaveBeenCalledTimes(1);
        const data = todosMock.create.mock.calls[0][0];
        expect(data).not.toHaveProperty('_id');
        expect(data.description).toBe('Funkgeräte laden');
        expect(data.dueDate).toBe(moment('24.12.2025 18:30', 'L HH:mm').toISOString());
        expect(todosMock.patch).not.toHaveBeenCalled();
        expect(notificationMock.success).toHaveBeenCalledWith('Todo erstelt');
        expect(form.isVisible).toBe(false);
    });

    it('patches an existing todo by _id', async () => {
        todosMock.patch.mockResolvedValue({});
        form.set({_id: 'abc', description: 'x', dueDate: '24.12.2025 18:30'});
        form.submit();
        await flush();
        expect(todosMock.patch).toHaveBeenCalledWith('abc', expect.objectContaining({
            _id: 'abc',
            dueDate: moment('24.12.2025 18:30', 'L HH:mm').toISOString(),
        }));
        expect(todosMock.create).not.toHaveBeenCalled();
        expect(notificationMock.success).toHaveBeenCalledWith('Todo aktualisiert');
    });

    it('shows the error when saving fails and keeps the form open', async () => {
        todosMock.create.mockRejectedValue(new Error('kaputt'));
        form.show();
        form.set({description: 'x', dueDate: '24.12.2025 18:30'});
        form.submit();
        await flush();
        expect(notificationMock.error).toHaveBeenCalledWith('kaputt');
        expect(form.isVisible).toBe(true);
    });

    it('remove deletes by _id and hides the form', async () => {
        todosMock.remove.mockResolvedValue({});
        form.show();
        form.set({_id: 'abc'});
        form.remove();
        await flush();
        expect(todosMock.remove).toHaveBeenCalledWith('abc');
        expect(notificationMock.success).toHaveBeenCalledWith('Todo gelöscht');
        expect(form.isVisible).toBe(false);
    });
});
