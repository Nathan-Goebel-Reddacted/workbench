import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateUserRolesCommand } from './updateUserRolesCommand';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { UserFactory } from '../../../domain/factory/userFactory';
import { UserRole } from '../../../domain/valueObject/role';
import { LastEditorCannotBeRemovedException } from '../../../domain/exception/lastEditorCannotBeRemoved';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { UserId } from '../../../domain/valueObject/userId';

export class UpdateUserRolesHandler implements ICommandHandler<UpdateUserRolesCommand> {
    constructor(
        private readonly repository: IUserRepository,
        private readonly factory: UserFactory,
    ) {}

    async handle(command: UpdateUserRolesCommand): Promise<void> {
        const existing = await this.repository.findById(new UserId(command.userId));
        if (!existing) throw new NotFoundError('User', command.userId);

        const losesEdit = existing.getRoles().includes(UserRole.EDIT) && !command.roles.includes(UserRole.EDIT);
        if (losesEdit && (await this.isLastEditor(command.userId))) {
            throw new LastEditorCannotBeRemovedException();
        }

        const updated = this.factory.create(
            existing.getId().getValue(),
            existing.getName().getValue(),
            existing.getSurname().getValue(),
            existing.getEmail().getValue(),
            command.roles,
            existing.getTokenVersion(),
        );
        // Les rôles voyagent dans le jeton : tant que l'ancien vaut, le retrait d'un rôle
        // ne changerait rien pour une session déjà ouverte.
        updated.invalidateSessions();
        await this.repository.save(updated);
    }

    private async isLastEditor(userId: string): Promise<boolean> {
        const editors = (await this.repository.findAll())
            .filter(u => u.getRoles().includes(UserRole.EDIT))
            .map(u => u.getId().getValue());
        return editors.length === 1 && editors[0] === userId;
    }
}
