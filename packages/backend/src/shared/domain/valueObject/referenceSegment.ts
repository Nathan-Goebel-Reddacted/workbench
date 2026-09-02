import { DomainException } from '../domainException';

/**
 * Un segment de référence est un entier de 1 à 9999, écrit sans zéros de remplissage : on lit et
 * on dit « quatre-huit-vingt-trois », pas « zéro-zéro-zéro-quatre ». Les colonnes ne s'alignent
 * donc plus à la virgule près, et c'est un prix assumé pour la lisibilité.
 */
export const SEGMENT_MIN = 1;
export const SEGMENT_MAX = 9999;

export class SegmentOutOfRangeException extends DomainException {
    constructor(value: number) {
        super();
        this.name = 'SegmentOutOfRangeException';
        this.message = `A reference segment must be between ${SEGMENT_MIN} and ${SEGMENT_MAX}, got ${value}`;
    }
}

/** `8` → `"8"`. Rejette ce qui sort de la plage plutôt que de produire une référence ingérable. */
export function formatSegment(value: number): string {
    if (!Number.isInteger(value) || value < SEGMENT_MIN || value > SEGMENT_MAX) {
        throw new SegmentOutOfRangeException(value);
    }
    return String(value);
}

/** `"8"` → `8`. */
export function parseSegment(value: string): number {
    return parseInt(value, 10);
}
