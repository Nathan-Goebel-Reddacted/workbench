import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetAllAgentToolsQuery } from './getAllAgentToolsQuery';
import { AgentToolDto, toAgentToolDto } from '../getAgentToolById/agentToolDto';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';

export class GetAllAgentToolsHandler implements IQueryHandler<GetAllAgentToolsQuery, AgentToolDto[]> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(): Promise<AgentToolDto[]> {
        const agentTools = await this.repository.findAll();
        return agentTools.map(toAgentToolDto);
    }
}
