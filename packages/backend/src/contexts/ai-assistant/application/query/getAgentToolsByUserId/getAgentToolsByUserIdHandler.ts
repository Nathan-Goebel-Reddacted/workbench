import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetAgentToolsByUserIdQuery } from './getAgentToolsByUserIdQuery';
import { AgentToolDto, toAgentToolDto } from '../getAgentToolById/agentToolDto';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { UserId } from '../../../domain/valueObject/userId';

export class GetAgentToolsByUserIdHandler implements IQueryHandler<GetAgentToolsByUserIdQuery, AgentToolDto[]> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(query: GetAgentToolsByUserIdQuery): Promise<AgentToolDto[]> {
        const agentTools = await this.repository.findByUserId(new UserId(query.userId));
        return agentTools.map(toAgentToolDto);
    }
}
