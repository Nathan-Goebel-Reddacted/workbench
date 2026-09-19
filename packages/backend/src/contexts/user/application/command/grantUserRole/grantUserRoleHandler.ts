import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { GrantUserRoleCommand } from './grantUserRoleCommand';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { UpdateUserRolesCommand } from '../updateUserRoles/updateUserRolesCommand';
import { UpdateUserRolesHandler } from '../updateUserRoles/updateUserRolesHandler';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { UserId } from '../../../domain/valueObject/userId';

export class GrantUserRoleHandler implements ICommandHandler<GrantUserRoleCommand> {
    constructor(
        private readonly repository: IUserRepository,
        private readonly updateRoles: UpdateUserRolesHandler,
    ) {}

    async handle(command: GrantUserRoleCommand): Promise<void> {
        const user = await this.repository.findById(new UserId(command.userId));
        if (!user) throw new NotFoundError('User', command.userId);

        const roles: string[] = user.getRoles();
        if (roles.includes(command.role)) return;

        await this.updateRoles.handle(new UpdateUserRolesCommand(command.userId, [...roles, command.role]));
    }
}
