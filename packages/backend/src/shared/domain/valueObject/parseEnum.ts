import { DomainException } from '@shared/domain/domainException';

/**
 * Convertit une chaîne venue de l'extérieur en membre d'énumération, ou refuse.
 *
 * Un `as SectionType` ne vérifie rien : une valeur inconnue traverse le domaine et ne se
 * révèle qu'au rendu, sous la forme d'un bloc vide sur le site public. Ce helper est le
 * point où la conversion échoue au lieu de mentir.
 */
export function parseEnum<T extends Record<string, string>>(value: string, members: T, label: string): T[keyof T] {
    const allowed = Object.values(members);
    if (!allowed.includes(value)) {
        throw new InvalidEnumValueException(label, value, allowed);
    }
    return value as T[keyof T];
}

export class InvalidEnumValueException extends DomainException {
    constructor(label: string, value: string, allowed: string[]) {
        super();
        this.name = 'InvalidEnumValueException';
        this.message = `Invalid ${label}: "${value}". Allowed: ${allowed.join(', ')}`;
    }
}
