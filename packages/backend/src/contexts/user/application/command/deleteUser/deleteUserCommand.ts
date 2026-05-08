import { Command } from "@shared/application/command/command";

export class DeleteUserCommand implements Command {
    static readonly commandName = "user.DeleteUser";
    readonly commandName: string;

    constructor(readonly userId: string) {
        this.commandName = DeleteUserCommand.commandName;
    }
}
