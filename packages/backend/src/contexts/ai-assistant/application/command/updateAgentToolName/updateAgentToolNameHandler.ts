import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateAgentToolNameCommand } from './updateAgentToolNameCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { Name } from '../../../domain/valueObject/name';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { AgentToolId } from '../../../domain/valueObject/agentToolId';

export class UpdateAgentToolNameHandler implements ICommandHandler<UpdateAgentToolNameCommand> {
    constructor(private readonly repository: IAgentToolRepository) {}

    async handle(command: UpdateAgentToolNameCommand): Promise<void> {
        const agentTool = await this.repository.findById(new AgentToolId(command.id));
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.rename(new Name(command.name));
        await this.repository.save(agentTool);
    }
}
