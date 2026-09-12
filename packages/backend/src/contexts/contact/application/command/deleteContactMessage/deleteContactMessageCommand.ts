import { Command } from '@shared/application/command/command';

export class DeleteContactMessageCommand implements Command {
    static readonly commandName = 'contact.DeleteContactMessage';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = DeleteContactMessageCommand.commandName;
    }
}
