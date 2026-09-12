import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteUserCommand } from './deleteUserCommand';
import { IUserRepository } from '../../../domain/repository/iUserRepository';
import { IUserDeletionListener } from '../../../domain/port/iUserDeletionListener';
import { UserRole } from '../../../domain/valueObject/role';
import { LastEditorCannotBeRemovedException } from '../../../domain/exception/lastEditorCannotBeRemoved';
import { ITransactionRunner } from '@shared/application/port/iTransactionRunner';
import { UserId } from '../../../domain/valueObject/userId';

export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
    constructor(
        private readonly repository: IUserRepository,
        private readonly listeners: IUserDeletionListener[],
        private readonly transaction: ITransactionRunner,
    ) {}

    async handle(command: DeleteUserCommand): Promise<void> {
        const user = await this.repository.findById(new UserId(command.userId));
        if (!user) return;

        if (user.getRoles().includes(UserRole.EDIT) && (await this.isLastEditor(command.userId))) {
            throw new LastEditorCannotBeRemovedException();
        }

        // Ce que le compte possédait ailleurs doit tomber avec lui : un jeton d'agent
        // survivant au propriétaire reste une session valide sans utilisateur derrière.
        //
        // Les deux moitiés sont solidaires dans les deux sens : un compte supprimé dont les
        // jetons survivent laisse des sessions orphelines, et des jetons révoqués pour un
        // compte finalement conservé privent l'utilisateur de ses agents sans que rien ne
        // le dise.
        await this.transaction.run(async () => {
            for (const listener of this.listeners) {
                await listener.onUserDeleted(command.userId);
            }
            await this.repository.deleteById(new UserId(command.userId));
        });
    }

    private async isLastEditor(userId: string): Promise<boolean> {
        const editors = (await this.repository.findAll())
            .filter(u => u.getRoles().includes(UserRole.EDIT))
            .map(u => u.getId().getValue());
        return editors.length === 1 && editors[0] === userId;
    }
}
