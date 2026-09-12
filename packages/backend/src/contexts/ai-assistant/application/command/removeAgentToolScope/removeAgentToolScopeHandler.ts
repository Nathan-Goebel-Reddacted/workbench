import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveAgentToolScopeCommand } from './removeAgentToolScopeCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { Scope } from '../../../domain/valueObject/scope';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { AgentToolId } from '../../../domain/valueObject/agentToolId';

export class RemoveAgentToolScopeHandler implements ICommandHandler<RemoveAgentToolScopeCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: RemoveAgentToolScopeCommand): Promise<void> {
        const agentTool = await this.repository.findById(new AgentToolId(command.id));
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.removeScope(new Scope(command.scope));
        await this.repository.save(agentTool);
    }
}
