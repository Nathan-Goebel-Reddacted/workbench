import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RotateAgentToolTokenCommand } from './rotateAgentToolTokenCommand';
import { IAgentToolRepository } from '../../../domain/repository/iAgentToolRepository';
import { Token } from '../../../domain/valueObject/token';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { ISecretHasher } from '../../../domain/port/iSecretHasher';

export class RotateAgentToolTokenHandler implements ICommandHandler<RotateAgentToolTokenCommand> {
    constructor(
        private readonly repository: IAgentToolRepository,
        private readonly hasher: ISecretHasher,
    ) {}

    async handle(command: RotateAgentToolTokenCommand): Promise<void> {
        const agentTool = await this.repository.findById(command.id);
        if (!agentTool) throw new NotFoundError('AgentTool', command.id);
        agentTool.rotateToken(new Token(await this.hasher.hash(command.newToken)));
        await this.repository.save(agentTool);
    }
}
