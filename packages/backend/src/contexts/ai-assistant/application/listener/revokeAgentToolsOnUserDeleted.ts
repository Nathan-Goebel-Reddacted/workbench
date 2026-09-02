import { IUserDeletionListener } from '@contexts/user/domain/port/iUserDeletionListener';
import { IAgentToolRepository } from '../../domain/repository/iAgentToolRepository';

// `agent_tools.userId` n'a pas de clé étrangère : rien en base ne fait tomber les agents
// avec leur propriétaire, et l'authentificateur ne regarde que la révocation. Sans ce
// listener, les jetons d'un compte supprimé continuent d'ouvrir /mcp.
export class RevokeAgentToolsOnUserDeleted implements IUserDeletionListener {
    constructor(private readonly repository: IAgentToolRepository) {}

    async onUserDeleted(userId: string): Promise<void> {
        const tools = await this.repository.findByUserId(userId);
        for (const tool of tools) {
            if (tool.isRevoked()) continue;
            tool.revoke();
            await this.repository.save(tool);
        }
    }
}
