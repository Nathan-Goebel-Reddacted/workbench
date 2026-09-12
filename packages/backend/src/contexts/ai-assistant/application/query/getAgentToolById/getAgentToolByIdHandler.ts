import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetAgentToolByIdQuery } from './getAgentToolByIdQuery';
import { AgentToolDto, toAgentToolDto } from './agentToolDto';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { AgentToolId } from '../../../domain/valueObject/agentToolId';

export class GetAgentToolByIdHandler implements IQueryHandler<GetAgentToolByIdQuery, AgentToolDto | null> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(query: GetAgentToolByIdQuery): Promise<AgentToolDto | null> {
        const agentTool = await this.repository.findById(new AgentToolId(query.id));
        if (!agentTool) return null;
        return toAgentToolDto(agentTool);
    }
}
