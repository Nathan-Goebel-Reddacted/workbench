import { Command } from '@shared/application/command/command';

export class CreateAgentToolCommand implements Command {
    static readonly commandName = 'aiAssistant.CreateAgentTool';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly userId: string,
        readonly name: string,
        readonly permission: string,
        readonly scopes: string[],
        readonly token: string,
    ) {
        this.commandName = CreateAgentToolCommand.commandName;
    }
}
