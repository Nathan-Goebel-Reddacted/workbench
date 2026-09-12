import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { InvalidateUserSessionsCommand } from './invalidateUserSessionsCommand';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { UserId } from '../../../domain/valueObject/userId';

export class InvalidateUserSessionsHandler implements ICommandHandler<InvalidateUserSessionsCommand> {
    constructor(private readonly repository: IUserRepository) {}

    async handle(command: InvalidateUserSessionsCommand): Promise<void> {
        const user = await this.repository.findById(new UserId(command.userId));
        if (!user) return;

        user.invalidateSessions();
        await this.repository.save(user);
    }
}
