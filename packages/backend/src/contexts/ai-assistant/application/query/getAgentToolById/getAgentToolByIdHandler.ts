import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetAgentToolByIdQuery } from "./getAgentToolByIdQuery";
import { AgentToolDto } from "./agentToolDto";
import { IAgentToolRepository } from "../../../domain/repository/iAgentToolRepository";
import { AgentTool } from "../../../domain/agentToolAggregate";

export class GetAgentToolByIdHandler implements IQueryHandler<GetAgentToolByIdQuery, AgentToolDto | null> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(query: GetAgentToolByIdQuery): Promise<AgentToolDto | null> {
        const agentTool = await this.repository.findById(query.id);
        if (!agentTool) return null;
        return this.toDto(agentTool);
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
