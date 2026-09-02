import { AgentTool } from '../../../domain/agentToolAggregate';

export type AgentToolDto = Readonly<{
    id: string;
    userId: string;
    name: string;
    permission: string;
    scopes: string[];
    createdAt: string;
    /** Null while the agent is active. */
    revokedAt: string | null;
}>;

export function toAgentToolDto(agentTool: AgentTool): AgentToolDto {
    const revokedAt = agentTool.getRevokedAt();
    return {
        id: agentTool.getId().getValue(),
        userId: agentTool.getUserId().getValue(),
        name: agentTool.getName().getValue(),
        permission: agentTool.getPermission().getValue(),
        scopes: agentTool.getScopes().map(s => s.getValue()),
        createdAt: agentTool.getCreatedAt().toISOString(),
        revokedAt: revokedAt ? revokedAt.toISOString() : null,
    };
}
