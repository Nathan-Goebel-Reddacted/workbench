import { Command } from '@shared/application/command/command';

export class InvalidateUserSessionsCommand implements Command {
    static readonly commandName = 'user.InvalidateUserSessions';
    readonly commandName: string;

    constructor(readonly userId: string) {
        this.commandName = InvalidateUserSessionsCommand.commandName;
    }
}
