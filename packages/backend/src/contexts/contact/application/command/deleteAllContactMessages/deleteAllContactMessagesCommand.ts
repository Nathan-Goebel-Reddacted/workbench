import { Command } from '@shared/application/command/command';

export class DeleteAllContactMessagesCommand implements Command {
    static readonly commandName = 'contact.DeleteAllContactMessages';
    readonly commandName: string;

    constructor() {
        this.commandName = DeleteAllContactMessagesCommand.commandName;
    }
}
