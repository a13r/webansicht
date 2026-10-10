import { describe, it, expect, vi, beforeEach } from 'vitest';

const find = vi.fn(() => Promise.resolve([]));

vi.mock('~/app', () => ({
  log: {
    on: () => {},
    find: (...args) => find(...args),
  },
}));
vi.mock('~/stores', () => ({
  loginReaction: () => {},
  router: { push: () => {} },
}));

const { default: LogStore } = await import('~/stores/log');

describe('LogStore', () => {
  let store;

  beforeEach(() => {
    find.mockClear();
    store = new LogStore();
  });

  it('accepts all live entries without a filter', () => {
    store.onCreated({ _id: '1', resource_id: 'a' });
    store.onCreated({ _id: '2', resource_id: 'b' });
    expect(store.list.map(i => i._id)).toEqual(['2', '1']);
  });

  it('ignores live entries of other resources when filtered', () => {
    store.form.$('resource_id').set('a');
    store.onCreated({ _id: '1', resource_id: 'b' });
    store.onCreated({ _id: '2', resource_id: 'a' });
    store.onCreated({ _id: '3', resource_id: { toString: () => 'a' } });
    expect(store.list.map(i => i._id)).toEqual(['3', '2']);
  });

  it('keeps the filter when toggling the sort order', () => {
    store.form.$('resource_id').set('a');
    find.mockClear();
    store.toggleSortOrder();
    expect(find).toHaveBeenCalledTimes(1);
    expect(find.mock.calls[0][0].query).toEqual({ $sort: { since: 1 }, resource_id: 'a' });
  });
});
