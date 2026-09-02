import { Command } from '@shared/application/command/command';
import { ContactField } from '@contexts/contact/domain/contactMessageAggregate';

export class SubmitContactMessageCommand implements Command {
    static readonly commandName = 'contact.SubmitContactMessage';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly fields: ContactField[],
        readonly senderEmail: string | null,
    ) {
        this.commandName = SubmitContactMessageCommand.commandName;
    }
}
