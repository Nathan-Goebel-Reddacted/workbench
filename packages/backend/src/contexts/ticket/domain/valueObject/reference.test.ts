import { describe, expect, it } from 'vitest';
import { TicketReference } from './reference.js';
import { SegmentOutOfRangeException } from '@shared/domain/valueObject/referenceSegment.js';
import { InvalidReferenceException } from '../exception/invalidReference.js';
import { NotNullOrEmptyException } from '../exception/notNullOrEmpty.js';

// La référence est l'identifiant lisible porté partout dans l'interface, dans les outils MCP et
// dans les liaisons de données du site public : sa forme canonique se décide ici et nulle part
// ailleurs.

describe('TicketReference', () => {
    it('accepte la forme `porteur.feature.ticket`', () => {
        const reference = new TicketReference('4.8.23');

        expect(reference.getValue()).toBe('4.8.23');
        expect(reference.getOwnerNumber()).toBe(4);
        expect(reference.getFeatureNumber()).toBe(8);
        expect(reference.getPosition()).toBe(23);
        expect(reference.getFeatureRef()).toBe('4.8');
    });

    it('normalise une référence rembourrée héritée d’une ancienne migration', () => {
        expect(new TicketReference('0003.0004.0001').getValue()).toBe('3.4.1');
    });

    it('refuse une chaîne vide ou blanche', () => {
        expect(() => new TicketReference('')).toThrow(NotNullOrEmptyException);
        expect(() => new TicketReference('   ')).toThrow(NotNullOrEmptyException);
    });

    it('refuse tout ce qui n’a pas trois segments numériques', () => {
        for (const invalid of ['4.8', '4.8.23.1', '4.8.a', 'x', '4-8-23', '4.8.']) {
            expect(() => new TicketReference(invalid), invalid).toThrow(InvalidReferenceException);
        }
    });

    it('refuse le segment zéro, qui n’existe pas dans la numérotation', () => {
        // Le format laisse passer `0`, c'est la plage du segment qui l'arrête.
        expect(() => new TicketReference('0.1.1')).toThrow(SegmentOutOfRangeException);
    });

    describe('create', () => {
        it('assemble les trois numéros', () => {
            expect(TicketReference.create(4, 8, 23).getValue()).toBe('4.8.23');
        });

        it('rejette ce qui déborde de 9999', () => {
            expect(() => TicketReference.create(10000, 1, 1)).toThrow(SegmentOutOfRangeException);
            expect(() => TicketReference.create(1, 0, 1)).toThrow(SegmentOutOfRangeException);
        });

        it('rejette un numéro non entier', () => {
            expect(() => TicketReference.create(1.5, 1, 1)).toThrow(SegmentOutOfRangeException);
        });

        it('accepte les bornes', () => {
            expect(TicketReference.create(1, 1, 1).getValue()).toBe('1.1.1');
            expect(TicketReference.create(9999, 9999, 9999).getValue()).toBe('9999.9999.9999');
        });
    });

    describe('equals', () => {
        it('compare sur la forme canonique, pas sur la chaîne d’origine', () => {
            expect(new TicketReference('0004.0008.0023').equals(new TicketReference('4.8.23'))).toBe(true);
            expect(new TicketReference('4.8.23').equals(new TicketReference('4.8.24'))).toBe(false);
        });
    });
});
