import { describe, expect, it } from 'vitest';
import { ErrorLogEntry, MAX_MESSAGE_LENGTH, MAX_STACK_LENGTH, MAX_URL_LENGTH } from './errorLogEntryAggregate.js';

// Le journal reçoit ce qu'une page cassée lui envoie : une entrée refusée est une erreur perdue,
// donc rien ne doit jeter ici.

const at = new Date('2026-09-05T10:00:00.000Z');

describe('ErrorLogEntry.record', () => {
    it('tronque un message plus long que la limite', () => {
        const entry = ErrorLogEntry.record({
            id: 'a',
            origin: 'front',
            message: 'x'.repeat(MAX_MESSAGE_LENGTH + 500),
            occurredAt: at,
        });

        expect(entry.getMessage()).toHaveLength(MAX_MESSAGE_LENGTH);
        expect(entry.getMessage().endsWith('…')).toBe(true);
    });

    it('tronque la trace et l’URL sans perdre l’entrée', () => {
        const entry = ErrorLogEntry.record({
            id: 'a',
            origin: 'front',
            message: 'boom',
            stack: 's'.repeat(MAX_STACK_LENGTH + 1),
            url: `https://example.test/${'p'.repeat(MAX_URL_LENGTH)}`,
            occurredAt: at,
        });

        expect(entry.getStack()).toHaveLength(MAX_STACK_LENGTH);
        expect(entry.getUrl()).toHaveLength(MAX_URL_LENGTH);
    });

    it('remplace un message vide plutôt que de refuser l’entrée', () => {
        const entry = ErrorLogEntry.record({ id: 'a', origin: 'back', message: '   ', occurredAt: at });

        expect(entry.getMessage()).toBe('Unknown error');
    });

    it('ramène les champs optionnels absents à null', () => {
        const entry = ErrorLogEntry.record({ id: 'a', origin: 'back', message: 'boom', occurredAt: at });

        expect(entry.getStack()).toBeNull();
        expect(entry.getUrl()).toBeNull();
        expect(entry.getUserId()).toBeNull();
        expect(entry.getCorrelationId()).toBeNull();
        expect(entry.getContext()).toEqual({});
    });
});
