import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetUserByIdQuery } from './getUserByIdQuery';
import { UserDto } from './userDto';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { User } from '../../../domain/userAggregate';

export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, UserDto | null> {
    constructor(private readonly repository: IUserRepository) {}

    async handle(query: GetUserByIdQuery): Promise<UserDto | null> {
        const user = await this.repository.findById(query.id);
        if (!user) return null;
        return this.toDto(user);
    }

    private toDto(user: User): UserDto {
        return {
            id: user.getId().getValue(),
            name: user.getName().getValue(),
            surname: user.getSurname().getValue(),
            email: user.getEmail().getValue(),
            roles: user.getRoles(),
            tokenVersion: user.getTokenVersion(),
        };
    }
}
