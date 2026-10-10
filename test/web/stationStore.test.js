import { describe, it, expect, vi, beforeEach } from 'vitest';

const find = vi.fn(() => Promise.resolve([]));

vi.mock('~/app', () => ({
  stations: {
    on: () => {},
    find: (...args) => find(...args),
  },
}));
vi.mock('~/stores', () => ({
  auth: { isAdmin: true, isDispo: false, user: {} },
}));
vi.mock('~/stores/index', () => ({
  loginReaction: () => {},
  notification: { error: () => {} },
}));

// The suite runs with isolate: false, so a store imported by another test file may still be
// cached with that file's mocks; load a fresh copy that uses the mocks above.
vi.resetModules();
const { default: StationStore } = await import('~/stores/stations');

describe('StationStore', () => {
  let store;

  beforeEach(() => {
    find.mockReset();
    store = new StationStore();
  });

  it('keeps a station that is added but not yet saved when find() resolves', async () => {
    let resolveFind;
    find.mockReturnValue(new Promise(resolve => { resolveFind = resolve; }));

    store.find();
    store.create();
    resolveFind([{ _id: 'a', name: 'A', currentPatients: 1, maxPatients: 2 }]);
    await vi.waitFor(() => expect(store.list.some(s => s._id === 'a')).toBe(true));

    expect(store.list.map(s => s._id)).toEqual(['a', undefined]);
    expect(store.list[1].isNew).toBe(true);
  });

  it('replaces saved stations with the fetched ones', async () => {
    find.mockResolvedValueOnce([{ _id: 'a', name: 'A' }, { _id: 'b', name: 'B' }]);
    store.find();
    await vi.waitFor(() => expect(store.list).toHaveLength(2));

    find.mockResolvedValueOnce([{ _id: 'b', name: 'B' }]);
    store.find();
    await vi.waitFor(() => expect(store.list.map(s => s._id)).toEqual(['b']));
  });
});
