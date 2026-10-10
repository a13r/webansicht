import {describe, expect, it} from 'vitest';
import {
    date,
    equalsConst,
    isEqualTo,
    minLength,
    minLengthIfNew,
    passwordEqualTo,
    required,
    requiredIf,
    requiredSelect,
} from '~/forms/validators';

const field = (value, label = 'Feld') => ({value, label});
const formWith = fields => ({$: name => fields[name]});
const run = (validator, f, form) => {
    const [ok, message] = validator({field: f, form});
    return [!!ok, message];
};

describe('validators', () => {
    describe('minLength', () => {
        it('accepts values with at least the given length', () => {
            expect(run(minLength(3), field('abc'))[0]).toBe(true);
            expect(run(minLength(3), field('abcd'))[0]).toBe(true);
        });

        it('rejects shorter values and names the field and length', () => {
            const [ok, message] = run(minLength(3), field('ab', 'Passwort'));
            expect(ok).toBe(false);
            expect(message).toBe('Passwort muss mind. 3 Zeichen lang sein');
        });
    });

    describe('minLengthIfNew', () => {
        it('enforces the length for new entries (no _id)', () => {
            const form = formWith({_id: {value: ''}});
            expect(run(minLengthIfNew(4), field('abc'), form)[0]).toBe(false);
            expect(run(minLengthIfNew(4), field('abcd'), form)[0]).toBe(true);
        });

        it('skips the length for existing entries', () => {
            const form = formWith({_id: {value: '123'}});
            expect(run(minLengthIfNew(4), field(''), form)[0]).toBe(true);
        });
    });

    describe('equalsConst', () => {
        it('accepts only the constant', () => {
            expect(run(equalsConst('LÖSCHEN'), field('LÖSCHEN'))[0]).toBe(true);
            expect(run(equalsConst('LÖSCHEN'), field('löschen'))[0]).toBe(false);
        });

        it('quotes the constant in the message', () => {
            expect(run(equalsConst('x'), field('y'))[1]).toBe('Wert ist nicht "x"');
        });
    });

    describe('isEqualTo / passwordEqualTo', () => {
        const form = formWith({other: {value: 'secret', label: 'Anderes'}});

        it('isEqualTo compares with the target field and names it', () => {
            expect(run(isEqualTo('other'), field('secret'), form)[0]).toBe(true);
            expect(run(isEqualTo('other'), field('nope'), form)).toEqual([false, 'Anderes stimmt nicht überein']);
        });

        it('passwordEqualTo compares with the target field', () => {
            expect(run(passwordEqualTo('other'), field('secret'), form)[0]).toBe(true);
            expect(run(passwordEqualTo('other'), field('nope'), form)).toEqual([false, 'Die Passwörter stimmen nicht überein']);
        });
    });

    describe('requiredSelect', () => {
        it('accepts a chosen option (index >= 0, also as string)', () => {
            expect(run(requiredSelect(), field(0))[0]).toBe(true);
            expect(run(requiredSelect(), field('2'))[0]).toBe(true);
        });

        it('rejects the unselected marker -1 and non-numbers', () => {
            expect(run(requiredSelect(), field(-1, 'Typ'))).toEqual([false, 'Typ muss gewählt werden']);
            expect(run(requiredSelect(), field('abc'))[0]).toBe(false);
            expect(run(requiredSelect(), field(undefined))[0]).toBe(false);
        });
    });

    describe('required', () => {
        it('rejects empty values and names the field', () => {
            expect(run(required(), field('', 'Name'))).toEqual([false, 'Name ist erforderlich']);
        });

        it('accepts non-empty values including 0', () => {
            expect(run(required(), field('a'))[0]).toBe(true);
            expect(run(required(), field(0))[0]).toBe(true);
        });
    });

    describe('requiredIf', () => {
        it('requires a value when the other field is set', () => {
            const form = formWith({dispo: {value: true}});
            expect(run(requiredIf('dispo'), field(''), form)[0]).toBe(false);
            expect(run(requiredIf('dispo'), field('x'), form)[0]).toBe(true);
        });

        it('does not require a value when the other field is not set', () => {
            const form = formWith({dispo: {value: false}});
            expect(run(requiredIf('dispo'), field(''), form)[0]).toBe(true);
        });
    });

    describe('date', () => {
        it('accepts a timestamp in the given format', () => {
            expect(run(date('L HH:mm'), field('24.12.2025 18:30'))[0]).toBe(true);
        });

        it('rejects garbage and impossible dates', () => {
            expect(run(date('L HH:mm'), field('foo'))[0]).toBe(false);
            expect(run(date('L HH:mm'), field('32.13.2025 18:30'))).toEqual([false, 'Datum und Uhrzeit erforderlich']);
        });
    });
});
