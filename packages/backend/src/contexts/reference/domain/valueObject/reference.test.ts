import { describe, expect, it } from 'vitest';
import { Reference } from './reference.js';
import { InvalidReferenceFormatException } from '../exception/invalidReferenceFormat.js';

// Une référence est ce qu'un humain dicte : « quatre-huit-vingt-trois ». Elle désigne un
// porteur, éventuellement sa feature, éventuellement son ticket — et rien d'autre.

describe('Reference', () => {
    it('lit un porteur seul', () => {
        const reference = Reference.parse('4');

        expect(reference.getOwnerNumber()).toBe(4);
        expect(reference.getFeatureNumber()).toBeUndefined();
        expect(reference.getTicketNumber()).toBeUndefined();
    });

    it('lit les trois niveaux', () => {
        const reference = Reference.parse('4.8.23');

        expect(reference.getOwnerNumber()).toBe(4);
        expect(reference.getFeatureNumber()).toBe(8);
        expect(reference.getTicketNumber()).toBe(23);
    });

    it('tolère les espaces autour et les zéros de remplissage', () => {
        expect(Reference.parse(' 0004.0008 ').getOwnerNumber()).toBe(4);
    });

    it('refuse ce qui n’est pas une référence', () => {
        for (const raw of ['', 'abc', '4.', '.4', '4.8.23.42', '4,8', '-4', '12345']) {
            expect(() => Reference.parse(raw), raw).toThrow(InvalidReferenceFormatException);
        }
    });
});
