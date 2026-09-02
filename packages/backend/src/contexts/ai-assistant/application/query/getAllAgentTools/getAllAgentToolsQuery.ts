import { Query } from '@shared/application/query/query';

export class GetAllAgentToolsQuery implements Query {
    static readonly queryName = 'aiAssistant.GetAllAgentTools';
    readonly queryName: string;

    constructor() {
        this.queryName = GetAllAgentToolsQuery.queryName;
    }
}
