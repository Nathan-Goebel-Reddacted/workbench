import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RevokeAgentToolCommand } from './revokeAgentToolCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class RevokeAgentToolHandler implements ICommandHandler<RevokeAgentToolCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: RevokeAgentToolCommand): Promise<void> {
        const agentTool = await this.repository.findById(command.id);
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.revoke();
        await this.repository.save(agentTool);
    }
}
