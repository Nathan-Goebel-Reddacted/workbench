import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RestoreAgentToolCommand } from './restoreAgentToolCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class RestoreAgentToolHandler implements ICommandHandler<RestoreAgentToolCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: RestoreAgentToolCommand): Promise<void> {
        const agentTool = await this.repository.findById(command.id);
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.restore();
        await this.repository.save(agentTool);
    }
}
