import { Command } from '@shared/application/command/command';

export class RemoveAllowedEmailCommand implements Command {
    static readonly commandName = 'auth.RemoveAllowedEmail';
    readonly commandName = RemoveAllowedEmailCommand.commandName;

    constructor(readonly email: string) {}
}
