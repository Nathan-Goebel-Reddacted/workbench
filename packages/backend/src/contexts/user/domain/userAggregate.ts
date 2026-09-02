import { UserId } from './valueObject/userId';
import { Name } from './valueObject/name';
import { Surname } from './valueObject/surname';
import { Email } from './valueObject/email';
import { UserRole, normalizeRoles } from './valueObject/role';

export class User {
    private readonly id: UserId;
    private readonly name: Name;
    private readonly surname: Surname;
    private readonly email: Email;
    private readonly roles: UserRole[];
    private tokenVersion: number;

    constructor(id: UserId, name: Name, surname: Surname, email: Email, roles: UserRole[], tokenVersion = 0) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.roles = normalizeRoles(roles);
        this.tokenVersion = tokenVersion;
    }

    getId(): UserId {
        return this.id;
    }

    getName(): Name {
        return this.name;
    }

    getSurname(): Surname {
        return this.surname;
    }

    getEmail(): Email {
        return this.email;
    }

    getRoles(): UserRole[] {
        return [...this.roles];
    }

    getTokenVersion(): number {
        return this.tokenVersion;
    }

    // Rend caduques toutes les sessions ouvertes : appelé quand ce que le jeton affirme
    // cesse d'être vrai — un rôle retiré, une déconnexion demandée.
    invalidateSessions(): void {
        this.tokenVersion += 1;
    }

    getDisplayName(): string {
        return `${this.name.getValue()} ${this.surname.getValue()}`;
    }
}
