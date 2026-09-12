import { describe, expect, it } from 'vitest';
import { ErrorLogEntryFactory } from './factory/errorLogEntryFactory.js';
import { ErrorOrigin } from './valueObject/errorOrigin.js';
import { MAX_MESSAGE_LENGTH, MAX_STACK_LENGTH, MAX_URL_LENGTH } from './valueObject/boundedText.js';

// Un journal qui refuse une entrée perd exactement ce qu'il existe pour garder. Rien ici ne
// lève : ce qui dépasse est coupé, ce qui manque vaut null.

const factory = new ErrorLogEntryFactory();

function record(overrides: Partial<Parameters<ErrorLogEntryFactory['record']>[0]> = {}) {
    return factory.record({
        origin: ErrorOrigin.FRONT,
        message: 'boom',
        occurredAt: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    });
}

describe('ErrorLogEntry', () => {
    it('conserve ce qu’on lui donne', () => {
        const entry = record({ stack: 'at foo()', url: 'https://exemple.fr/page', userId: 'u1' });

        expect(entry.getOrigin()).toBe(ErrorOrigin.FRONT);
        expect(entry.getMessage().getValue()).toBe('boom');
        expect(entry.getStack()?.getValue()).toBe('at foo()');
        expect(entry.getUrl()?.getValue()).toBe('https://exemple.fr/page');
        expect(entry.getUserId()).toBe('u1');
        expect(entry.getId().getValue()).toBeTruthy();
    });

    it('tronque au lieu de refuser', () => {
        const entry = record({
            message: 'x'.repeat(MAX_MESSAGE_LENGTH + 500),
            stack: 'y'.repeat(MAX_STACK_LENGTH + 500),
            url: 'z'.repeat(MAX_URL_LENGTH + 500),
        });

        expect(entry.getMessage().getValue()).toHaveLength(MAX_MESSAGE_LENGTH);
        expect(entry.getMessage().getValue().endsWith('…')).toBe(true);
        expect(entry.getStack()?.getValue()).toHaveLength(MAX_STACK_LENGTH);
        expect(entry.getUrl()?.getValue()).toHaveLength(MAX_URL_LENGTH);
    });

    it('remplace un message vide plutôt que de laisser une entrée muette', () => {
        expect(record({ message: '   ' }).getMessage().getValue()).toBe('Unknown error');
    });

    it('ramène à null ce qui est absent ou vide', () => {
        const entry = record({ stack: '   ', url: null, userId: undefined });

        expect(entry.getStack()).toBeNull();
        expect(entry.getUrl()).toBeNull();
        expect(entry.getUserId()).toBeNull();
        expect(entry.getCorrelationId()).toBeNull();
        expect(entry.getContext()).toEqual({});
    });

    it('horodate l’entrée quand l’appelant ne le fait pas', () => {
        const before = Date.now();
        const entry = factory.record({ origin: ErrorOrigin.BACK, message: 'boom' });

        expect(entry.getOccurredAt().getTime()).toBeGreaterThanOrEqual(before);
    });
});
