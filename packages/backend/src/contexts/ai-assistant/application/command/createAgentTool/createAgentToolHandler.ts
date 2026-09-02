import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateAgentToolCommand } from './createAgentToolCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { AgentToolFactory } from '../../../domain/factory/agentToolFactory';

export class CreateAgentToolHandler implements ICommandHandler<CreateAgentToolCommand> {
    constructor(
        private readonly repository: IAgentToolRepository,
        private readonly factory: AgentToolFactory,
    ) {}

    async handle(command: CreateAgentToolCommand): Promise<void> {
        const agentTool = await this.factory.create(
            command.id,
            command.userId,
            command.name,
            command.permission,
            command.scopes,
            command.token,
        );
        await this.repository.save(agentTool);
    }
}
