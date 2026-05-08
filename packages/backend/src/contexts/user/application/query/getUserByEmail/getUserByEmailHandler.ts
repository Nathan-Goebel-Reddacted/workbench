import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetUserByEmailQuery } from "./getUserByEmailQuery";
import { UserDto } from "../getUserById/userDto";
import { IUserRepository } from "../../../domain/repository/iUserRepository";
import { User } from "../../../domain/userAggregate";

export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, UserDto | null> {
    constructor(private readonly repository: IUserRepository) {}

    async handle(query: GetUserByEmailQuery): Promise<UserDto | null> {
        const user = await this.repository.findByEmail(query.email);
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
        };
    }
}
