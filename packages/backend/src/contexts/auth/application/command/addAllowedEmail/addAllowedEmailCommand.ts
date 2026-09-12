import { Command } from '@shared/application/command/command';

export class AddAllowedEmailCommand implements Command {
    static readonly commandName = 'auth.AddAllowedEmail';
    readonly commandName = AddAllowedEmailCommand.commandName;

    constructor(readonly email: string) {}
}
