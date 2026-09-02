import { Command } from '@shared/application/command/command';

export class UpdateAgentToolPermissionCommand implements Command {
    static readonly commandName = 'aiAssistant.UpdateAgentToolPermission';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly permission: string,
    ) {
        this.commandName = UpdateAgentToolPermissionCommand.commandName;
    }
}
