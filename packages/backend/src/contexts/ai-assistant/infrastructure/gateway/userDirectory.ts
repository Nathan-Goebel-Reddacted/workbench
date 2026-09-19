import { QueryBus } from '@shared/application/query/queryBus';
import { IUserDirectory } from '../../domain/port/iUserDirectory';
import { GetAllUsersQuery } from '@contexts/user/application/query/getAllUsers/getAllUsersQuery';
import { UserDto } from '@contexts/user/application/query/getUserById/userDto';

export class UserDirectory implements IUserDirectory {
    constructor(private readonly queryBus: QueryBus) {}

    async displayNames(): Promise<ReadonlyMap<string, string>> {
        const users = (await this.queryBus.dispatch(new GetAllUsersQuery())) as UserDto[];
        return new Map(users.map(user => [user.id, `${user.name} ${user.surname}`]));
    }
}
