import { Command } from '@shared/application/command/command';

export class GrantUserRoleCommand implements Command {
    static readonly commandName = 'user.GrantUserRole';
    readonly commandName: string;

    constructor(
        readonly userId: string,
        readonly role: string,
    ) {
        this.commandName = GrantUserRoleCommand.commandName;
    }
}
