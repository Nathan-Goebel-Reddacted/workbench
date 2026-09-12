import { User } from '../userAggregate';
import { UserId } from '../valueObject/userId';
import { Name } from '../valueObject/name';
import { Surname } from '../valueObject/surname';
import { Email } from '../valueObject/email';
import { UserRole } from '../valueObject/role';
import { InvalidRoleException } from '../exception/invalidRole';

export class UserFactory {
    create(id: string, name: string, surname: string, email: string, roles: string[], tokenVersion = 0): User {
        return new User(
            new UserId(id),
            new Name(name),
            new Surname(surname),
            new Email(email),
            roles.map(r => {
                if (!Object.values(UserRole).includes(r as UserRole)) {
                    throw new InvalidRoleException(r);
                }
                return r as UserRole;
            }),
            tokenVersion,
        );
    }
}
