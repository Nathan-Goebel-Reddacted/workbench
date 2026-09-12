import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteAllContactMessagesCommand } from './deleteAllContactMessagesCommand';
import { IContactMessageRepository } from '../../../domain/repository/iContactMessageRepository';

export class DeleteAllContactMessagesHandler implements ICommandHandler<DeleteAllContactMessagesCommand> {
    constructor(private readonly repository: IContactMessageRepository) {}

    async handle(): Promise<void> {
        await this.repository.deleteAll();
    }
}
