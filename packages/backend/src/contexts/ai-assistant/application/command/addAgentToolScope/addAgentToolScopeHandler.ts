import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddAgentToolScopeCommand } from './addAgentToolScopeCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { Scope } from '../../../domain/valueObject/scope';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class AddAgentToolScopeHandler implements ICommandHandler<AddAgentToolScopeCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: AddAgentToolScopeCommand): Promise<void> {
        const agentTool = await this.repository.findById(command.id);
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.addScope(new Scope(command.scope));
        await this.repository.save(agentTool);
    }
}
