import { UserId } from "./valueObject/userId";
import { Name } from "./valueObject/name";
import { Surname } from "./valueObject/surname";
import { Email } from "./valueObject/email";
import { UserRole, normalizeRoles } from "./valueObject/role";

export class User {
    private readonly id: UserId;
    private readonly name: Name;
    private readonly surname: Surname;
    private readonly email: Email;
    private readonly roles: UserRole[];

    constructor(id: UserId, name: Name, surname: Surname, email: Email, roles: UserRole[]) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.roles = normalizeRoles(roles);
    }

    getId(): UserId {
        return this.id;
    }

    getEmail(): Email {
        return this.email;
    }

    getRoles(): UserRole[] {
        return [...this.roles];
    }

    getDisplayName(): string {
        return `${this.name.getValue()} ${this.surname.getValue()}`;
    }
}