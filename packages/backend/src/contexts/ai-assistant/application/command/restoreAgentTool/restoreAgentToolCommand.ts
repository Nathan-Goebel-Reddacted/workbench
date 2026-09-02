import { Command } from '@shared/application/command/command';

export class RestoreAgentToolCommand implements Command {
    static readonly commandName = 'aiAssistant.RestoreAgentTool';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = RestoreAgentToolCommand.commandName;
    }
}
