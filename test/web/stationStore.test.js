import { describe, it, expect, vi, beforeEach } from 'vitest';

const find = vi.fn(() => Promise.resolve([]));
const patch = vi.fn();

vi.mock('~/app', () => ({
  stations: {
    on: () => {},
    find: (...args) => find(...args),
    patch: (...args) => patch(...args),
  },
}));
// '~/stores' and '~/stores/index' are the same module, so both mocks must provide every
// export the store uses; otherwise whichever mock is registered last wins
const storesMock = vi.hoisted(() => ({
  auth: { isAdmin: true, isDispo: false, user: {} },
  loginReaction: () => {},
  notification: { error: () => {} },
}));
vi.mock('~/stores', () => storesMock);
vi.mock('~/stores/index', () => storesMock);

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

  it('does not let a station created by another client take over an unsaved card', () => {
    store.create();
    const pending = store.list[0];
    pending.form.$('name').set('Mine');

    store.onCreated({ _id: 'x', name: 'Theirs', currentPatients: 0, maxPatients: 1 });

    expect(store.list).toHaveLength(2);
    expect(pending.isNew).toBe(true);
    expect(store.list.find(s => s._id === 'x').name).toBe('Theirs');
  });

  it('adopts the created event of the unsaved card that is being submitted', () => {
    store.create();
    const pending = store.list[0];
    pending.form.$('name').set('Mine');
    pending.form.$submitting = true;

    store.onCreated({ _id: 'x', name: 'Mine', currentPatients: 0, maxPatients: 1 });

    expect(store.list).toHaveLength(1);
    expect(store.list[0]._id).toBe('x');
  });

  describe('unsaved edits on a saved station', () => {
    const saved = { _id: 'a', name: 'A', currentPatients: 1, maxPatients: 5 };
    let station;

    beforeEach(async () => {
      find.mockResolvedValueOnce([saved]);
      store.find();
      await vi.waitFor(() => expect(store.list).toHaveLength(1));
      station = store.list[0];
      station.form.$('currentPatients').set(3);
    });

    it('survive a find()', async () => {
      find.mockResolvedValueOnce([{ ...saved }]);
      store.find();
      await vi.waitFor(() => expect(find).toHaveBeenCalledTimes(2));
      await Promise.resolve();

      expect(store.list[0]).toBe(station);
      expect(station.form.$('currentPatients').value).toBe(3);
      expect(station.form.changed).toBeTruthy();
    });

    it('survive an update of the station by another client', () => {
      store.onUpdated({ ...saved, maxPatients: 8 });

      expect(station.maxPatients).toBe(8);
      expect(station.form.$('currentPatients').value).toBe(3);
    });

    it('are replaced by the saved values after the own save', async () => {
      patch.mockResolvedValueOnce({ ...saved, currentPatients: 3 });
      await station.form.submit();

      // only the changed field is sent
      expect(patch).toHaveBeenCalledWith('a', { currentPatients: 3 });
      expect(station.currentPatients).toBe(3);
      expect(station.form.changed).toBeFalsy();
    });
  });

  it('refreshes the form of a station without unsaved edits', async () => {
    find.mockResolvedValueOnce([{ _id: 'a', name: 'A', currentPatients: 1, maxPatients: 5 }]);
    store.find();
    await vi.waitFor(() => expect(store.list).toHaveLength(1));

    store.onUpdated({ _id: 'a', name: 'A', currentPatients: 4, maxPatients: 5 });

    expect(store.list[0].form.$('currentPatients').value).toBe(4);
  });

  it('gives every station a stable key', async () => {
    store.create();
    const pending = store.list[0];
    const key = pending.key;
    find.mockResolvedValueOnce([{ _id: 'a', name: 'A' }]);
    store.find();
    await vi.waitFor(() => expect(store.list).toHaveLength(2));

    expect(pending.key).toBe(key);
    expect(new Set(store.list.map(s => s.key)).size).toBe(2);
  });
});
