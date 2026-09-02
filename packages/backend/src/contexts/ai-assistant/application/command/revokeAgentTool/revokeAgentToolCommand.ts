import { Command } from '@shared/application/command/command';

export class RevokeAgentToolCommand implements Command {
    static readonly commandName = 'aiAssistant.RevokeAgentTool';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = RevokeAgentToolCommand.commandName;
    }
}
