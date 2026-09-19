import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetAllAgentToolsQuery } from './getAllAgentToolsQuery';
import { AgentToolListItemDto } from './agentToolListItemDto';
import { toAgentToolDto } from '../getAgentToolById/agentToolDto';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { IUserDirectory } from '../../../domain/port/iUserDirectory';

export class GetAllAgentToolsHandler implements IQueryHandler<GetAllAgentToolsQuery, AgentToolListItemDto[]> {
    constructor(
        private readonly repository: IAgentToolRepository,
        private readonly userDirectory: IUserDirectory,
    ) {}

    async handle(): Promise<AgentToolListItemDto[]> {
        const [agentTools, names] = await Promise.all([this.repository.findAll(), this.userDirectory.displayNames()]);
        return agentTools.map(agentTool => {
            const dto = toAgentToolDto(agentTool);
            return { ...dto, ownerName: names.get(dto.userId) ?? null };
        });
    }
}
