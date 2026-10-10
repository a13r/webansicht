import {vi, describe, it, expect} from 'vitest';

vi.mock('~/app', () => ({positions: {}, resources: {}}));
vi.mock('~/stores/index', () => ({loginReaction: vi.fn()}));

const {positionColor, NO_RESOURCE_COLOR, UNKNOWN_STATE_COLOR} = await import('~/stores/map');

describe('positionColor', () => {
    it('is red without a resource', () => {
        expect(positionColor(undefined)).toBe('red');
        expect(NO_RESOURCE_COLOR).toBe('red');
    });

    it('uses the state colour for a known state', () => {
        expect(positionColor({state: 1})).toBe('#C1FFC1');
        expect(positionColor({state: 10})).toBe('#FFFF95');
    });

    it('does not treat state 0 as missing', () => {
        expect(positionColor({state: 0})).toBe('#FFFFFF');
        expect(positionColor({state: 0})).not.toBe('red');
    });

    it('falls back for an unknown state without throwing', () => {
        expect(positionColor({state: 9})).toBe(UNKNOWN_STATE_COLOR);
        expect(positionColor({state: 'abc'})).toBe(UNKNOWN_STATE_COLOR);
    });

    it('falls back for a resource without state', () => {
        expect(positionColor({})).toBe(UNKNOWN_STATE_COLOR);
        expect(positionColor({state: null})).toBe(UNKNOWN_STATE_COLOR);
    });
});
