import { DomainException } from '@shared/domain/domainException';

export class InvalidAuthEmailException extends DomainException {
    constructor(value: string) {
        super(`Not a usable email address: "${value}"`);
    }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * L'adresse telle que l'application la manipule : toujours en minuscules.
 *
 * La normalisation vit ici et non dans les routes, parce que c'est elle qui fait l'identité —
 * la whitelist, les demandes d'accès et les comptes doivent tous désigner la même personne.
 * Un `.toLowerCase()` oublié à un seul endroit suffisait à créer un doublon invisible.
 */
export class AuthEmail {
    private readonly value: string;

    constructor(value: string) {
        const normalized = (value ?? '').trim().toLowerCase();
        if (!EMAIL_PATTERN.test(normalized)) throw new InvalidAuthEmailException(value);
        this.value = normalized;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: AuthEmail): boolean {
        return this.value === other.value;
    }
}
