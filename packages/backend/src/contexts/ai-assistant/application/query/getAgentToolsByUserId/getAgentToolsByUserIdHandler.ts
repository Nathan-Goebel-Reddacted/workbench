import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetAgentToolsByUserIdQuery } from "./getAgentToolsByUserIdQuery";
import { AgentToolDto } from "../getAgentToolById/agentToolDto";
import { IAgentToolRepository } from "../../../domain/repository/iAgentToolRepository";
import { AgentTool } from "../../../domain/agentToolAggregate";

export class GetAgentToolsByUserIdHandler implements IQueryHandler<GetAgentToolsByUserIdQuery, AgentToolDto[]> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(query: GetAgentToolsByUserIdQuery): Promise<AgentToolDto[]> {
        const agentTools = await this.repository.findByUserId(query.userId);
        return agentTools.map(t => this.toDto(t));
    }

    private toDto(agentTool: AgentTool): AgentToolDto {
        return {
            id: agentTool.getId().getValue(),
            userId: agentTool.getUserId().getValue(),
            name: agentTool.getName().getValue(),
            permission: agentTool.getPermission().getValue(),
            scopes: agentTool.getScopes().map(s => s.getValue()),
        };
    }
}
