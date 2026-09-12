import { parseSegment } from '@shared/domain/valueObject/referenceSegment';
import { InvalidReferenceFormatException } from '../exception/invalidReferenceFormat';

/** `4`, `4.8` ou `4.8.23`. Les zéros de remplissage restent tolérés en entrée. */
const FORMAT = /^\d{1,4}(\.\d{1,4}){0,2}$/;

/**
 * Une référence désigne un porteur, sa feature, son ticket — dans cet ordre, et tronquée à la
 * profondeur voulue. La forme est une règle du domaine, pas une validation d'entrée : c'est
 * elle qui dit ce qu'''est une référence, et ce qui n'''en est jamais une.
 */
export class Reference {
    private constructor(
        private readonly raw: string,
        private readonly segments: number[],
    ) {}

    static parse(raw: string): Reference {
        const trimmed = raw.trim();
        if (!FORMAT.test(trimmed)) throw new InvalidReferenceFormatException();
        return new Reference(trimmed, trimmed.split('.').map(parseSegment));
    }

    getOwnerNumber(): number {
        return this.segments[0];
    }

    /** Absent quand la référence s'''arrête au porteur. */
    getFeatureNumber(): number | undefined {
        return this.segments[1];
    }

    getTicketNumber(): number | undefined {
        return this.segments[2];
    }

    getValue(): string {
        return this.raw;
    }
}
