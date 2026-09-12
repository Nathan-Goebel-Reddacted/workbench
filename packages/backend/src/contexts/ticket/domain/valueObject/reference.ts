import { InvalidReferenceException } from '../exception/invalidReference';
import { NotNullOrEmptyException } from '@shared/domain/exception/notNullOrEmpty';
import { formatSegment, parseSegment } from '@shared/domain/valueObject/referenceSegment';

/**
 * Identifiant lisible d'un ticket : `[porteur].[feature].[ticket]`, par exemple `4.8.23`.
 *
 * Chaque segment est relatif à son parent — la feature 8 du projet 4, le ticket 23 de cette
 * feature. Un numéro isolé ne veut donc rien dire hors de sa chaîne, et c'est pour cela que la
 * référence complète est portée partout plutôt que reconstituée.
 */
export class TicketReference {
    private static readonly FORMAT = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;

    private readonly value: string;

    constructor(value: string) {
        if (!this.notNullOrEmpty(value)) {
            throw new NotNullOrEmptyException();
        }
        if (!this.validFormat(value)) {
            throw new InvalidReferenceException();
        }
        // Forme canonique, décidée ici et nulle part ailleurs : une référence lue au format
        // rembourré (`0003.0004.0001`, hérité d'une ancienne migration) ressort normalisée
        // (`3.4.1`). Rien en aval — DTO, arborescence, interface — n'a de reformatage à faire, et
        // chaque enregistrement d'un ticket ancien réécrit sa référence au format courant.
        this.value = value
            .split('.')
            .map(segment => formatSegment(parseSegment(segment)))
            .join('.');
    }

    private notNullOrEmpty(value: string): boolean {
        return value !== null && value.trim() !== '';
    }

    private validFormat(value: string): boolean {
        return TicketReference.FORMAT.test(value);
    }

    /** Assemble une référence à partir des trois numéros. Rejette ce qui déborde de 9999. */
    static create(ownerNumber: number, featureNumber: number, position: number): TicketReference {
        return new TicketReference(
            `${formatSegment(ownerNumber)}.${formatSegment(featureNumber)}.${formatSegment(position)}`,
        );
    }

    getValue(): string {
        return this.value;
    }

    /** Numéro du porteur — premier segment. */
    getOwnerNumber(): number {
        return parseSegment(this.value.split('.')[0]);
    }

    /** Numéro de la feature dans son porteur — deuxième segment. */
    getFeatureNumber(): number {
        return parseSegment(this.value.split('.')[1]);
    }

    /** Numéro du ticket dans sa feature — troisième segment. */
    getPosition(): number {
        return parseSegment(this.value.split('.')[2]);
    }

    /** Préfixe désignant la feature : `4.8`. */
    getFeatureRef(): string {
        const [owner, feature] = this.value.split('.');
        return `${owner}.${feature}`;
    }

    equals(other: TicketReference): boolean {
        return this.value === other.value;
    }
}
