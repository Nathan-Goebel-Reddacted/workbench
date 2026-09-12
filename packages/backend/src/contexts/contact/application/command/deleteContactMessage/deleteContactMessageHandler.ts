import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteContactMessageCommand } from './deleteContactMessageCommand';
import { IContactMessageRepository } from '../../../domain/repository/iContactMessageRepository';

export class DeleteContactMessageHandler implements ICommandHandler<DeleteContactMessageCommand> {
    constructor(private readonly repository: IContactMessageRepository) {}

    async handle(command: DeleteContactMessageCommand): Promise<void> {
        await this.repository.delete(command.id);
    }
}
