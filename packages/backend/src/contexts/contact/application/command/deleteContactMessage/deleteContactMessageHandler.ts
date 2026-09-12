import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteContactMessageCommand } from './deleteContactMessageCommand';
import { IContactMessageRepository } from '../../../domain/repository/iContactMessageRepository';
import { ContactMessageId } from '../../../domain/valueObject/contactMessageId';

export class DeleteContactMessageHandler implements ICommandHandler<DeleteContactMessageCommand> {
    constructor(private readonly repository: IContactMessageRepository) {}

    async handle(command: DeleteContactMessageCommand): Promise<void> {
        await this.repository.delete(new ContactMessageId(command.id));
    }
}
