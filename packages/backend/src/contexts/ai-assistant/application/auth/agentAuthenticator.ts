import { AgentTool } from '../../domain/agentToolAggregate';
import { IAgentToolRepository } from '../../domain/repository/iAgentToolRepository';
import { parseAgentToken } from './agentToken';

/** Resolves the AgentTool behind a presented token, or nothing if it cannot be trusted. */
export class AgentAuthenticator {
    constructor(private readonly repository: IAgentToolRepository) {}

    async authenticate(presented: string | undefined): Promise<AgentTool | null> {
        if (!presented) return null;

        const parts = parseAgentToken(presented);
        if (!parts) return null;

        const agentTool = await this.repository.findById(parts.agentToolId);
        if (!agentTool) return null;

        // Checked before the token: a revoked agent must not even learn whether its secret is still valid.
        if (agentTool.isRevoked()) return null;

        const isValid = await agentTool.verifyToken(parts.secret);
        return isValid ? agentTool : null;
    }
}
