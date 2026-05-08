import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetAllUsersQuery } from "./getAllUsersQuery";
import { UserDto } from "../getUserById/userDto";
import { IUserRepository } from "../../../domain/repository/iUserRepository";
import { User } from "../../../domain/userAggregate";

export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery, UserDto[]> {
    constructor(private readonly repository: IUserRepository) {}

    async handle(_query: GetAllUsersQuery): Promise<UserDto[]> {
        const users = await this.repository.findAll();
        return users.map(u => this.toDto(u));
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
