import { Query } from '@shared/application/query/query';

export class GetUserByEmailQuery implements Query {
    static readonly queryName = 'user.GetUserByEmail';
    readonly queryName: string;

    constructor(readonly email: string) {
        this.queryName = GetUserByEmailQuery.queryName;
    }
}
