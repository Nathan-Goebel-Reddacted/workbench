import { Command } from '@shared/application/command/command';

export class UpdateAgentToolNameCommand implements Command {
    static readonly commandName = 'aiAssistant.UpdateAgentToolName';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly name: string,
    ) {
        this.commandName = UpdateAgentToolNameCommand.commandName;
    }
}
