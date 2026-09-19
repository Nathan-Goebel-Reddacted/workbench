import { Command } from '@shared/application/command/command';

export class RevokeUserRoleCommand implements Command {
    static readonly commandName = 'user.RevokeUserRole';
    readonly commandName: string;

    constructor(
        readonly userId: string,
        readonly role: string,
    ) {
        this.commandName = RevokeUserRoleCommand.commandName;
    }
}
