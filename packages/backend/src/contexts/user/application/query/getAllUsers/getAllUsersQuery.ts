import { Query } from '@shared/application/query/query';

export class GetAllUsersQuery implements Query {
    static readonly queryName = 'user.GetAllUsers';
    readonly queryName: string;

    constructor() {
        this.queryName = GetAllUsersQuery.queryName;
    }
}
