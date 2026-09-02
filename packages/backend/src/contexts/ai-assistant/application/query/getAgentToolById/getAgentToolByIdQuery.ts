import { Query } from '@shared/application/query/query';

export class GetAgentToolByIdQuery implements Query {
    static readonly queryName = 'aiAssistant.GetAgentToolById';
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetAgentToolByIdQuery.queryName;
    }
}
