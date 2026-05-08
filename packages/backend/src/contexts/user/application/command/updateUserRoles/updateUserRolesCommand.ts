import { Command } from "@shared/application/command/command";

export class UpdateUserRolesCommand implements Command {
    static readonly commandName = "user.UpdateUserRoles";
    readonly commandName: string;

    constructor(
        readonly userId: string,
        readonly roles: string[],
    ) {
        this.commandName = UpdateUserRolesCommand.commandName;
    }
}
