import { Command } from '@shared/application/command/command';

export class AddAgentToolScopeCommand implements Command {
    static readonly commandName = 'aiAssistant.AddAgentToolScope';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly scope: string,
    ) {
        this.commandName = AddAgentToolScopeCommand.commandName;
    }
}
