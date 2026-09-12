import { AuthEmail } from '../valueObject/email';

/**
 * La liste blanche. Elle ne porte aucun comportement — une adresse y est, ou n'y est pas —
 * et n'a donc pas d'agrégat : ce serait une coquille autour d'une chaîne.
 */
export interface IAllowedEmailRepository {
    contains(email: AuthEmail): Promise<boolean>;
    findAll(): Promise<AuthEmail[]>;
    /** Lève `EmailAlreadyAllowedException` si l'adresse y est déjà. */
    add(email: AuthEmail): Promise<void>;
    remove(email: AuthEmail): Promise<void>;
}
