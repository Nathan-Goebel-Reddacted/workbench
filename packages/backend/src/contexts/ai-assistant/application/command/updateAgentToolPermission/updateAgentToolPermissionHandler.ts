import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateAgentToolPermissionCommand } from './updateAgentToolPermissionCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { Permission } from '../../../domain/valueObject/permission';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { AgentToolId } from '../../../domain/valueObject/agentToolId';

export class UpdateAgentToolPermissionHandler implements ICommandHandler<UpdateAgentToolPermissionCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: UpdateAgentToolPermissionCommand): Promise<void> {
        const agentTool = await this.repository.findById(new AgentToolId(command.id));
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.changePermission(new Permission(command.permission));
        await this.repository.save(agentTool);
    }
}
