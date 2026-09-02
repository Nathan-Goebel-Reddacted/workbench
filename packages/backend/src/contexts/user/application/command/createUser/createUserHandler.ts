import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateUserCommand } from './createUserCommand';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { UserFactory } from '../../../domain/factory/userFactory';

export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        private readonly repository: IUserRepository,
        private readonly factory: UserFactory,
    ) {}

    async handle(command: CreateUserCommand): Promise<void> {
        const user = this.factory.create(command.id, command.name, command.surname, command.email, command.roles);
        await this.repository.save(user);
    }
}
