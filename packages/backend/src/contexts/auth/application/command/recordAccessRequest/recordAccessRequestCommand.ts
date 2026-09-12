import { Command } from '@shared/application/command/command';

export class RecordAccessRequestCommand implements Command {
    static readonly commandName = 'auth.RecordAccessRequest';
    readonly commandName = RecordAccessRequestCommand.commandName;

    constructor(
        readonly email: string,
        readonly displayName: string,
    ) {}
}
